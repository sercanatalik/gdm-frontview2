'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@tanstack/react-store';
import { financingMessagesStore } from '@/lib/store/financing-messages';
import MDEditor from '@uiw/react-md-editor';
import { Sparkles, Undo2, Eye, FileText } from 'lucide-react';
import { generateSummariseText, generateSubjectForEmail } from '@/lib/ai/actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { render } from "@react-email/components";
import { Email } from "@/components/emails/financing-email";

interface EmailReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailReportModal({ open, onOpenChange }: EmailReportModalProps) {
  const financingMessage = useStore(financingMessagesStore, (state) => state.financingMessage);
  const financingReport = financingMessage?.message || '';
  const financingImages = financingMessage?.imagePath || [];


  // Form state
  const [formData, setFormData] = useState({ to: '', subject: 'AI Analysis Report' });
  const [editorValue, setEditorValue] = useState(financingReport);
  const [originalValue, setOriginalValue] = useState(financingReport);

  // UI state
  const [activeTab, setActiveTab] = useState('edit');
  const [isSummarized, setIsSummarized] = useState(false);
  const [htmlValue, setHtmlValue] = useState('');

  // Loading states
  const [isSending, setIsSending] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false);

  // Update editor when financing report changes
  useEffect(() => {
    if (financingReport) {
      setEditorValue(financingReport);
      setOriginalValue(financingReport);
      setIsSummarized(false);
    }
  }, [financingReport]);

  // Render HTML email preview
  useEffect(() => {
    const renderEmail = async () => {
      try {
        const html = await render(
          <Email
            subject={formData.subject}
            content={editorValue}
            imagePaths={financingImages}
          />
        );
        setHtmlValue(html);
      } catch (error) {
        console.error('Error rendering email:', error);
      }
    };
    renderEmail();
  }, [editorValue, formData.subject, financingImages]);

  // Generate subject when modal opens
  useEffect(() => {
    if (!open || !financingReport) return;

    const generateSubject = async () => {
      setIsGeneratingSubject(true);
      try {
        const { subject } = await generateSubjectForEmail(financingReport);
        setFormData(prev => ({ ...prev, subject }));
      } catch (error) {
        console.error('Error generating subject:', error);
      } finally {
        setIsGeneratingSubject(false);
      }
    };

    generateSubject();
  }, [open, financingReport]);

  // Handlers
  const handleSummarize = useCallback(async () => {
    if (!editorValue) return;
    setIsSummarizing(true);
    try {
      const { summary } = await generateSummariseText(editorValue);
      setEditorValue(summary);
      setIsSummarized(true);
    } catch (error) {
      console.error('Error summarizing:', error);
      alert('Failed to summarize content. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  }, [editorValue]);

  const handleRevert = useCallback(() => {
    setEditorValue(originalValue);
    setIsSummarized(false);
  }, [originalValue]);

  const handleSend = useCallback(async () => {
    setIsSending(true);
    try {
      // TODO: Implement email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Sending email:', { ...formData, content: editorValue });
      alert('Email sent successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [formData, editorValue, onOpenChange]);

  const updateFormField = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full !max-w-[98vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Email Report</DialogTitle>
          <DialogDescription>Send the AI generated summary via email</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-y-auto">
          {/* Email To */}
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com"
              value={formData.to}
              onChange={updateFormField('to')}
            />
          </div>

          {/* Email Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={updateFormField('subject')}
              placeholder={isGeneratingSubject ? "Generating subject..." : "Enter email subject"}
              disabled={isGeneratingSubject}
            />
          </div>

          {/* Content Editor & Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Financing Report</Label>
              <div className="flex gap-2">
                {isSummarized && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRevert}
                    className="border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white"
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    Revert
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSummarize}
                  disabled={!editorValue || isSummarizing || isSummarized}
                  className="border-red-500 text-red-400 hover:bg-orange-500 hover:text-white"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isSummarizing ? 'Summarizing...' : 'Summarize'}
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">
                  <FileText className="mr-2 h-4 w-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="mt-2">
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    {financingReport ? (
                      <MDEditor
                        value={editorValue}
                        onChange={(val) => setEditorValue(val || '')}
                        height={700}
                        preview="preview"
                      />
                    ) : (
                      <div className="p-4 text-muted-foreground">
                        No financing report available.
                      </div>
                    )}
                  </div>

                  {/* Display images */}
                  {financingImages.length > 0 && (
                    <div className="border rounded-lg p-4 bg-white">
                      <Label className="mb-2 block">Attached Charts ({financingImages.length})</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {financingImages.map((imagePath, index) => {
                          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                          const fullImageUrl = `${baseUrl}/gdm-frontview/tmp/${imagePath}`;

                          return (
                            <div key={index} className="border rounded p-2">
                              <img
                                src={fullImageUrl}
                                alt={`Chart ${index + 1}`}
                                className="w-full h-auto rounded"
                                onError={(e) => {
                                  console.error('Failed to load image:', fullImageUrl);
                                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                                }}
                              />
                              <p className="text-xs text-muted-foreground mt-2 truncate">{imagePath}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-2">
                <div className="border rounded-lg overflow-hidden bg-white">
                  {htmlValue ? (
                    <iframe
                      srcDoc={htmlValue}
                      className="w-full min-h-[700px] border-0"
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div className="p-6 min-h-[700px] flex items-center justify-center">
                      <div className="text-muted-foreground">Generating preview...</div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!formData.to || isSending}>
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
