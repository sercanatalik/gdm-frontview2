'use client';

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';

interface ChatPromptProps {
  onSubmit: (message: PromptInputMessage) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatPrompt({
  onSubmit,
  disabled = false,
  placeholder = "Ask anything..."
}: ChatPromptProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <PromptInput onSubmit={onSubmit} globalDrop multiple>
        <PromptInputBody>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <PromptInputTextarea
            placeholder={placeholder}
            disabled={disabled}
          />
        </PromptInputBody>
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
          </PromptInputTools>
          <PromptInputSubmit disabled={disabled} />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
