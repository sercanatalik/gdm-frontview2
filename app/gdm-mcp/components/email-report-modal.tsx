'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useStore } from '@tanstack/react-store';
import { financingMessagesStore } from '@/lib/store/financing-messages';
import MDEditor from '@uiw/react-md-editor';
import { Sparkles, Undo2 } from 'lucide-react';
import { generateSummariseText, generateSubjectForEmail } from '@/lib/ai/actions';

interface EmailReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailReportModal({ open, onOpenChange }: EmailReportModalProps) {
  const messages = useStore(financingMessagesStore, (state) => state.messages);

  const [formData, setFormData] = useState({
    to: '',
    subject: 'AI Analysis Report',
    body: '',
  });

  const [isSending, setIsSending] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false);

  // Get FinancingReport from store
  const financingReportData = messages['FinancingReport'];
  const financingReport = financingReportData?.message || '';
  const imagePaths = financingReportData?.imagePath || [];
  const [editorValue, setEditorValue] = useState<string>(financingReport);
  const [originalValue, setOriginalValue] = useState<string>(financingReport);
  const [isSummarized, setIsSummarized] = useState(false);

  // Update editor value when financingReport changes
  useEffect(() => {
    if (financingReport) {
      setEditorValue(financingReport);
      setOriginalValue(financingReport);
      setIsSummarized(false);
    }
  }, [financingReport]);

  // Convert messages object to array for rendering
  const messageEntries = Object.entries(messages);

  // Format messages for email body
  const formatMessages = () => {
    if (messageEntries.length === 0) return 'No messages to include in the report.';

    return messageEntries
      .map(([id, msgData], index) => {
        const imageList = msgData.imagePath.length > 0
          ? `Images:\n${msgData.imagePath.map(path => `- ${path}`).join('\n')}`
          : 'No images';
        return `--- Message ${index + 1} (ID: ${id}) ---\n\n${msgData.message}\n\n${imageList}\n\n`;
      })
      .join('\n');
  };

  // Update body with formatted messages and generate subject when modal opens
  useEffect(() => {
    const generateSubject = async () => {
      if (open && financingReport) {
        setFormData((prev) => ({
          ...prev,
          body: formatMessages(),
        }));

        // Generate subject line from the report content
        setIsGeneratingSubject(true);
        try {
          const { subject } = await generateSubjectForEmail(financingReport);
          setFormData((prev) => ({
            ...prev,
            subject: subject,
          }));
        } catch (error) {
          console.error('Error generating subject:', error);
          // Keep default subject on error
        } finally {
          setIsGeneratingSubject(false);
        }
      }
    };

    generateSubject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, financingReport]);

  const handleSummarize = async () => {
    if (!editorValue) return;

    setIsSummarizing(true);

    try {
      const { summary } = await generateSummariseText(editorValue);
      setEditorValue(summary);
      setIsSummarized(true);
    } catch (error) {
      console.error('Error summarizing content:', error);
      alert('Failed to summarize content. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleRevert = () => {
    setEditorValue(originalValue);
    setIsSummarized(false);
  };

  const handleSend = async () => {
    setIsSending(true);

    try {
      // TODO: Implement actual email sending logic here
      // For now, just simulate sending
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('Sending email:', formData);
      alert('Email sent successfully!');
      onOpenChange(false);

      // Reset form
      setFormData({
        to: '',
        subject: 'AI Analysis Report',
        body: '',
      });
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full !max-w-[98vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Email  Report</DialogTitle>
          <DialogDescription>
            Send the AI generated summary via email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder={isGeneratingSubject ? "Generating subject..." : "Enter email subject"}
              disabled={isGeneratingSubject}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Financing Report</Label>
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
          </div>

          <div className="text-sm text-muted-foreground">
            {messageEntries.length} message{messageEntries.length !== 1 ? 's' : ''} included in this report
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!formData.to || isSending}
          >
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
