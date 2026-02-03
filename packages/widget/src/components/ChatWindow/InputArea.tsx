import { useState, useRef, useEffect } from 'preact/hooks';
import { cn } from '@/utils/cn';

const MAX_MESSAGE_LENGTH = 2000;

interface InputAreaProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  isDisabled: boolean;
  error: string | null;
  onClearError: () => void;
}

export function InputArea({ onSend, isLoading, isDisabled, error, onClearError }: InputAreaProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const canSend = message.trim().length > 0 && !isLoading && !isDisabled;

  const handleSubmit = (e?: Event) => {
    e?.preventDefault();
    const trimmed = message.trim();
    if (trimmed && canSend) {
      onSend(trimmed);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charsRemaining = MAX_MESSAGE_LENGTH - message.length;
  const showCounter = charsRemaining <= 200;

  return (
    <div class="border-t border-widget-border p-3 bg-widget-bg">
      {/* Error bar */}
      {error && (
        <div
          class="mb-2 p-2 bg-red-50 border border-red-200 rounded-widget-sm text-xs text-red-600 flex justify-between items-center"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={onClearError}
            class="text-red-400 hover:text-red-600 ml-2 shrink-0"
            aria-label="Dismiss error"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 14 14" fill="currentColor">
              <path d="M13.3 0.7a1 1 0 0 0-1.4 0L7 5.6 2.1 0.7a1 1 0 0 0-1.4 1.4L5.6 7 0.7 11.9a1 1 0 1 0 1.4 1.4L7 8.4l4.9 4.9a1 1 0 0 0 1.4-1.4L8.4 7l4.9-4.9a1 1 0 0 0 0-1.4z" />
            </svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} class="flex items-end gap-2">
        <div class="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onInput={(e) => {
              const val = (e.target as HTMLTextAreaElement).value;
              if (val.length <= MAX_MESSAGE_LENGTH) setMessage(val);
            }}
            onKeyDown={handleKeyDown}
            placeholder={isDisabled ? 'Message limit reached' : 'Type your message...'}
            disabled={isDisabled}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={1}
            class={cn(
              'w-full resize-none px-3 py-2 text-sm rounded-xl',
              'border border-widget-border bg-widget-header-bg',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'placeholder:text-widget-text-secondary',
              'text-widget-text',
            )}
            aria-label="Message input"
          />
          {showCounter && (
            <span
              class={cn(
                'absolute right-2 bottom-1 text-[10px]',
                charsRemaining <= 50 ? 'text-red-500' : 'text-widget-text-secondary',
              )}
            >
              {charsRemaining}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSend}
          class={cn(
            'p-2.5 rounded-xl bg-primary text-white',
            'hover:bg-primary-hover',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors shrink-0',
            'focus:outline-none focus:ring-2 focus:ring-primary/30',
          )}
          aria-label="Send message"
        >
          {isLoading ? (
            <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
