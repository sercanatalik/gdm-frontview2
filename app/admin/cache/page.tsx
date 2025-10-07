'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertCircle, Copy, Database, Edit3, Eye, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiPath } from '@/lib/utils'
import JsonView from '@uiw/react-json-view'

interface CacheEntry {
  key: string
  value: unknown
  ttl: number | null
  size: number
}

interface CacheData {
  keys: CacheEntry[]
  total: number
  pattern: string
}

const INITIAL_FORM_STATE = {
  key: '',
  value: '',
  ttl: '',
  jsonMode: false,
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatTTL = (ttl: number | null) => {
  if (!ttl || ttl <= 0) return 'No expiry'
  if (ttl < 60) return `${ttl}s`
  if (ttl < 3600) return `${Math.floor(ttl / 60)}m ${ttl % 60}s`
  return `${Math.floor(ttl / 3600)}h ${Math.floor((ttl % 3600) / 60)}m`
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const isArray = (value: unknown): value is unknown[] => Array.isArray(value)

const isJsonValue = (value: unknown) => isObject(value) || isArray(value)

const parseValue = (value: string, jsonMode: boolean) => {
  if (!jsonMode) {
    return value
  }

  return JSON.parse(value)
}

const parseTtl = (ttl: string) => {
  if (!ttl) {
    return undefined
  }

  const parsed = parseInt(ttl, 10)
  if (Number.isNaN(parsed)) {
    throw new Error('TTL must be a number')
  }

  return parsed
}

const serializeValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const jsonViewStyles: CSSProperties = {
  '--w-rjv-font-family':
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  '--w-rjv-font-size': '12px',
  '--w-rjv-line-height': '1.4',
  '--w-rjv-color-text': 'hsl(var(--foreground))',
  '--w-rjv-color-background': 'transparent',
  '--w-rjv-color-string': 'hsl(var(--primary))',
  '--w-rjv-color-number': 'hsl(var(--chart-1))',
  '--w-rjv-color-boolean': 'hsl(var(--chart-2))',
  '--w-rjv-color-null': 'hsl(var(--muted-foreground))',
  '--w-rjv-color-key': 'hsl(var(--foreground))',
  '--w-rjv-color-brackets': 'hsl(var(--muted-foreground))',
}

export default function CacheAdminPage() {
  const [cacheData, setCacheData] = useState<CacheData>({ keys: [], total: 0, pattern: '*' })
  const [loading, setLoading] = useState(false)
  const [searchPattern, setSearchPattern] = useState('*')
  const [selectedKey, setSelectedKey] = useState<CacheEntry | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)

  const totalSize = useMemo(
    () => cacheData.keys.reduce((sum, entry) => sum + entry.size, 0),
    [cacheData.keys]
  )

  const fetchCacheData = useCallback(async (pattern: string = '*') => {
    setLoading(true)
    try {
      const response = await fetch(apiPath(`/api/cache?pattern=${encodeURIComponent(pattern)}`))
      const result = await response.json()

      if (result.success) {
        setCacheData(result.data)
      } else {
        toast.error(result.error || 'Failed to fetch cache data')
      }
    } catch {
      toast.error('Network error while fetching cache data')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshCurrentPattern = useCallback(() => {
    return fetchCacheData(searchPattern)
  }, [fetchCacheData, searchPattern])

  useEffect(() => {
    fetchCacheData()
  }, [fetchCacheData])

  const handleSearch = useCallback(() => {
    refreshCurrentPattern()
  }, [refreshCurrentPattern])

  const handleAddEntry = useCallback(async () => {
    if (!formData.key.trim()) {
      toast.error('Key is required')
      return
    }

    try {
      const value = parseValue(formData.value, formData.jsonMode)
      const ttl = parseTtl(formData.ttl)

      const response = await fetch(apiPath('/api/cache'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: formData.key,
          value,
          ttl,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Cache entry added successfully')
        setShowAddDialog(false)
        setFormData(INITIAL_FORM_STATE)
        refreshCurrentPattern()
      } else {
        toast.error(result.error || 'Failed to add cache entry')
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'TTL must be a number') {
        toast.error(error.message)
        return
      }
      toast.error('Invalid JSON or network error')
    }
  }, [formData, refreshCurrentPattern])

  const handleEditEntry = useCallback(async () => {
    if (!selectedKey) {
      return
    }

    try {
      const value = parseValue(formData.value, formData.jsonMode)
      const ttl = parseTtl(formData.ttl)

      const response = await fetch(apiPath('/api/cache'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: selectedKey.key,
          value,
          ttl,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Cache entry updated successfully')
        setShowEditDialog(false)
        setSelectedKey(null)
        setFormData(INITIAL_FORM_STATE)
        refreshCurrentPattern()
      } else {
        toast.error(result.error || 'Failed to update cache entry')
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'TTL must be a number') {
        toast.error(error.message)
        return
      }
      toast.error('Invalid JSON or network error')
    }
  }, [formData, refreshCurrentPattern, selectedKey])

  const handleDeleteEntry = useCallback(
    async (key: string) => {
      try {
        const response = await fetch(apiPath(`/api/cache?key=${encodeURIComponent(key)}`), {
          method: 'DELETE',
        })

        const result = await response.json()
        if (result.success) {
          toast.success('Cache entry deleted successfully')
          refreshCurrentPattern()
        } else {
          toast.error(result.error || 'Failed to delete cache entry')
        }
      } catch {
        toast.error('Network error while deleting cache entry')
      }
    },
    [refreshCurrentPattern]
  )

  const handleDeleteAll = useCallback(async () => {
    try {
      const response = await fetch(apiPath('/api/cache?action=flush'), {
        method: 'DELETE',
      })

      const result = await response.json()
      if (result.success) {
        toast.success('All cache entries cleared successfully')
        refreshCurrentPattern()
      } else {
        toast.error(result.error || 'Failed to clear cache')
      }
    } catch {
      toast.error('Network error while clearing cache')
    }
  }, [refreshCurrentPattern])

  const handleDeletePattern = useCallback(async () => {
    try {
      const response = await fetch(apiPath(`/api/cache?pattern=${encodeURIComponent(searchPattern)}`), {
        method: 'DELETE',
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`Deleted ${result.data.deleted} cache entries`)
        refreshCurrentPattern()
      } else {
        toast.error(result.error || 'Failed to delete cache entries')
      }
    } catch {
      toast.error('Network error while deleting cache entries')
    }
  }, [refreshCurrentPattern, searchPattern])

  const openEditDialog = useCallback((entry: CacheEntry) => {
    setSelectedKey(entry)
    setFormData({
      key: entry.key,
      value: serializeValue(entry.value),
      ttl: entry.ttl?.toString() || '',
      jsonMode: isJsonValue(entry.value),
    })
    setShowEditDialog(true)
  }, [])

  const openViewDialog = useCallback((entry: CacheEntry) => {
    setSelectedKey(entry)
    setShowViewDialog(true)
  }, [])

  const handleAddDialogChange = useCallback((open: boolean) => {
    setShowAddDialog(open)
    if (!open) {
      setFormData(INITIAL_FORM_STATE)
    }
  }, [])

  const handleEditDialogChange = useCallback((open: boolean) => {
    setShowEditDialog(open)
    if (!open) {
      setSelectedKey(null)
      setFormData(INITIAL_FORM_STATE)
    }
  }, [])

  const handleViewDialogChange = useCallback((open: boolean) => {
    setShowViewDialog(open)
    if (!open) {
      setSelectedKey(null)
    }
  }, [])

  const copyToClipboard = useCallback(async (text: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      toast.error('Clipboard not available')
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Redis Cache Admin</h1>
          <p className="text-muted-foreground">Manage and monitor Redis cache entries</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshCurrentPattern} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheData.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pattern</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheData.pattern}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSize(totalSize)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search &amp; Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search pattern (e.g., user:*, *cache*, specific_key)"
              value={searchPattern}
              onChange={(e) => setSearchPattern(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All Cache Entries</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all cache entries. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAll}>Delete All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Pattern
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Pattern: {searchPattern}</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all cache entries matching the pattern{' '}
                    <span className="font-mono">{searchPattern}</span>. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletePattern}>Delete Pattern</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">Loading cache data...</div>
          ) : cacheData.keys.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No cache entries found matching pattern{' '}
              <span className="font-mono">{searchPattern}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>TTL</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cacheData.keys.map((entry) => (
                    <TableRow key={entry.key}>
                      <TableCell className="max-w-xs truncate font-mono">
                        <div className="flex items-center gap-2">
                          {entry.key}
                          {isJsonValue(entry.value) && (
                            <Badge variant="outline" className="text-xs">
                              {isObject(entry.value) ? 'Object' : 'Array'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.ttl ? 'secondary' : 'outline'}>
                          {formatTTL(entry.ttl)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatSize(entry.size)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openViewDialog(entry)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(entry)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(entry.key)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Cache Entry</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the cache entry{' '}
                                  <span className="font-mono">{entry.key}</span>?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteEntry(entry.key)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={handleAddDialogChange}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Cache Entry</DialogTitle>
            <DialogDescription>Create a new cache entry with key, value, and TTL</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="cache:key:name"
              />
            </div>
            <div>
              <Label htmlFor="value">Value</Label>
              <Textarea
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.jsonMode ? '{"key": "value"}' : 'Simple text value'}
                rows={6}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="ttl">TTL (seconds)</Label>
                <Input
                  id="ttl"
                  type="number"
                  value={formData.ttl}
                  onChange={(e) => setFormData({ ...formData, ttl: e.target.value })}
                  placeholder="300"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setFormData({ ...formData, jsonMode: !formData.jsonMode })}
                >
                  {formData.jsonMode ? 'Text Mode' : 'JSON Mode'}
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleAddDialogChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddEntry}>Add Entry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={handleEditDialogChange}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Cache Entry: {selectedKey?.key}</DialogTitle>
            <DialogDescription>Update the value and TTL for this cache entry</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-value">Value</Label>
              <Textarea
                id="edit-value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                rows={6}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="edit-ttl">TTL (seconds)</Label>
                <Input
                  id="edit-ttl"
                  type="number"
                  value={formData.ttl}
                  onChange={(e) => setFormData({ ...formData, ttl: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setFormData({ ...formData, jsonMode: !formData.jsonMode })}
                >
                  {formData.jsonMode ? 'Text Mode' : 'JSON Mode'}
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleEditDialogChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditEntry}>Update Entry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={handleViewDialogChange}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Cache Entry</DialogTitle>
            <DialogDescription>View the details of this cache entry</DialogDescription>
          </DialogHeader>
          {selectedKey && (
            <div className="space-y-4">
              <div>
                <Label>Key</Label>
                <div className="rounded bg-muted p-2 font-mono text-sm">{selectedKey.key}</div>
              </div>
              <div>
                <Label>Value</Label>
                {isJsonValue(selectedKey.value) ? (
                  <div className="max-h-96 overflow-auto rounded bg-muted p-2">
                    <JsonView
                      value={selectedKey.value}
                      style={jsonViewStyles}
                      displayDataTypes={false}
                      displayObjectSize={false}
                      enableClipboard={false}
                      collapsed={false}
                      shortenTextAfterLength={50}
                    />
                  </div>
                ) : (
                  <pre className="max-h-96 overflow-auto rounded bg-muted p-2 text-sm">
                    {typeof selectedKey.value === 'string'
                      ? selectedKey.value
                      : serializeValue(selectedKey.value)}
                  </pre>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>TTL</Label>
                  <div className="text-sm">{formatTTL(selectedKey.ttl)}</div>
                </div>
                <div>
                  <Label>Size</Label>
                  <div className="text-sm">{formatSize(selectedKey.size)}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}