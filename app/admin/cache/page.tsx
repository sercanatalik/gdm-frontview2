'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Edit3, Plus, RefreshCw, Search, Database, AlertCircle, Eye, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface CacheEntry {
  key: string
  value: any
  ttl: number | null
  size: number
}

interface CacheData {
  keys: CacheEntry[]
  total: number
  pattern: string
}

export default function CacheAdminPage() {
  const [cacheData, setCacheData] = useState<CacheData>({ keys: [], total: 0, pattern: '*' })
  const [loading, setLoading] = useState(false)
  const [searchPattern, setSearchPattern] = useState('*')
  const [selectedKey, setSelectedKey] = useState<CacheEntry | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  
  // Add/Edit form state
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    ttl: '',
    jsonMode: false
  })

  const fetchCacheData = async (pattern: string = '*') => {
    setLoading(true)
    try {
      const response = await fetch(`/api/cache?pattern=${encodeURIComponent(pattern)}`)
      const result = await response.json()
      
      if (result.success) {
        setCacheData(result.data)
      } else {
        toast.error('Failed to fetch cache data')
      }
    } catch (error) {
      toast.error('Network error while fetching cache data')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchCacheData(searchPattern)
  }

  const handleAddEntry = async () => {
    try {
      let value = formData.value
      if (formData.jsonMode) {
        value = JSON.parse(formData.value)
      }

      const response = await fetch('/api/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: formData.key,
          value,
          ttl: formData.ttl ? parseInt(formData.ttl) : undefined
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Cache entry added successfully')
        setShowAddDialog(false)
        setFormData({ key: '', value: '', ttl: '', jsonMode: false })
        fetchCacheData(searchPattern)
      } else {
        toast.error(result.error || 'Failed to add cache entry')
      }
    } catch (error) {
      toast.error('Invalid JSON or network error')
    }
  }

  const handleEditEntry = async () => {
    if (!selectedKey) return
    
    try {
      let value = formData.value
      if (formData.jsonMode) {
        value = JSON.parse(formData.value)
      }

      const response = await fetch('/api/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: selectedKey.key,
          value,
          ttl: formData.ttl ? parseInt(formData.ttl) : undefined
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Cache entry updated successfully')
        setShowEditDialog(false)
        setSelectedKey(null)
        fetchCacheData(searchPattern)
      } else {
        toast.error(result.error || 'Failed to update cache entry')
      }
    } catch (error) {
      toast.error('Invalid JSON or network error')
    }
  }

  const handleDeleteEntry = async (key: string) => {
    try {
      const response = await fetch(`/api/cache?key=${encodeURIComponent(key)}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Cache entry deleted successfully')
        fetchCacheData(searchPattern)
      } else {
        toast.error(result.error || 'Failed to delete cache entry')
      }
    } catch (error) {
      toast.error('Network error while deleting cache entry')
    }
  }

  const handleDeleteAll = async () => {
    try {
      const response = await fetch('/api/cache?action=flush', {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        toast.success('All cache entries cleared successfully')
        fetchCacheData(searchPattern)
      } else {
        toast.error(result.error || 'Failed to clear cache')
      }
    } catch (error) {
      toast.error('Network error while clearing cache')
    }
  }

  const handleDeletePattern = async () => {
    try {
      const response = await fetch(`/api/cache?pattern=${encodeURIComponent(searchPattern)}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`Deleted ${result.data.deleted} cache entries`)
        fetchCacheData(searchPattern)
      } else {
        toast.error(result.error || 'Failed to delete cache entries')
      }
    } catch (error) {
      toast.error('Network error while deleting cache entries')
    }
  }

  const openEditDialog = (entry: CacheEntry) => {
    setSelectedKey(entry)
    setFormData({
      key: entry.key,
      value: typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value, null, 2),
      ttl: entry.ttl?.toString() || '',
      jsonMode: typeof entry.value !== 'string'
    })
    setShowEditDialog(true)
  }

  const openViewDialog = (entry: CacheEntry) => {
    setSelectedKey(entry)
    setShowViewDialog(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTTL = (ttl: number | null) => {
    if (!ttl || ttl <= 0) return 'No expiry'
    if (ttl < 60) return `${ttl}s`
    if (ttl < 3600) return `${Math.floor(ttl / 60)}m ${ttl % 60}s`
    return `${Math.floor(ttl / 3600)}h ${Math.floor((ttl % 3600) / 60)}m`
  }

  useEffect(() => {
    fetchCacheData()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Redis Cache Admin</h1>
          <p className="text-muted-foreground">Manage and monitor Redis cache entries</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchCacheData(searchPattern)} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="text-2xl font-bold">
              {formatSize(cacheData.keys.reduce((sum, entry) => sum + entry.size, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Actions</CardTitle>
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
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
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
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Pattern
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Pattern: {searchPattern}</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all cache entries matching the pattern "{searchPattern}". This action cannot be undone.
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

      {/* Cache Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading cache data...</div>
          ) : cacheData.keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No cache entries found matching pattern "{searchPattern}"
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
                      <TableCell className="font-mono max-w-xs truncate">
                        {entry.key}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.ttl ? 'secondary' : 'outline'}>
                          {formatTTL(entry.ttl)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatSize(entry.size)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewDialog(entry)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(entry)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(entry.key)}
                          >
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
                                  Are you sure you want to delete the cache entry "{entry.key}"?
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

      {/* Add Entry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Cache Entry</DialogTitle>
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
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddEntry}>Add Entry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Cache Entry: {selectedKey?.key}</DialogTitle>
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
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditEntry}>Update Entry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Entry Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Cache Entry</DialogTitle>
          </DialogHeader>
          {selectedKey && (
            <div className="space-y-4">
              <div>
                <Label>Key</Label>
                <div className="font-mono text-sm bg-muted p-2 rounded">
                  {selectedKey.key}
                </div>
              </div>
              <div>
                <Label>Value</Label>
                <pre className="text-sm bg-muted p-2 rounded overflow-auto max-h-64">
                  {typeof selectedKey.value === 'string' 
                    ? selectedKey.value 
                    : JSON.stringify(selectedKey.value, null, 2)}
                </pre>
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