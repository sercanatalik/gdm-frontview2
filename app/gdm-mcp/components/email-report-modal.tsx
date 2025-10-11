'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { useStore } from '@tanstack/react-store';
import { messagesStore } from '@/lib/store/ai-messages';
import { Response } from '@/components/ai-elements/response';

interface EmailReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailReportModal({ open, onOpenChange }: EmailReportModalProps) {
  const messages = useStore(messagesStore, (state) => state.messages);

  const [formData, setFormData] = useState({
    to: '',
    subject: 'AI Analysis Report',
    body: '',
  });

  const [isSending, setIsSending] = useState(false);

  // Format messages for email body
  const formatMessages = () => {
    if (messages.length === 0) return 'No messages to include in the report.';

    return messages
      .map((msg, index) => {
        const date = new Date(msg.timestamp).toLocaleString();
        return `--- Message ${index + 1} (${date}) ---\n\n${msg.text}\n\n`;
      })
      .join('\n');
  };

  // Update body with formatted messages when modal opens or messages change
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        body: formatMessages(),
      }));
    }
  }, [open, messages]);

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
      <DialogContent className="w-full max-w-[95vw] max-h-[150vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Email Analysis Report</DialogTitle>
          <DialogDescription>
            Send the AI analysis results via email
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message Preview</Label>
            <div className="border rounded-lg p-2 bg-muted/30 min-h-[500px] max-h-[700px] overflow-y-auto">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div key={msg.id} className="mb-6 pb-6 border-b last:border-b-0">
                    <div className="text-xs text-muted-foreground mb-2">
                      Message {index + 1} • {new Date(msg.timestamp).toLocaleString()}
                    </div>
                   
                      {msg.text}
                   
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No messages to include in the report.</p>
              )}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {messages.length} message{messages.length !== 1 ? 's' : ''} included in this report
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
