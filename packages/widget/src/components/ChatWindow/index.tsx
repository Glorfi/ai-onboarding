import { useRef, useEffect } from 'preact/hooks';
import { cn } from '@/utils/cn';
import { Header } from './Header';
import { MessagesArea } from './MessagesArea';
import { InputArea } from './InputArea';
import { Footer } from './Footer';
import type { Message } from '@/types';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (content: string) => void;
  onRate: (messageId: string, rating: 'positive' | 'negative', feedback?: string) => void;
  onEmailSubmit: (questionId: string, email: string) => Promise<void>;
  onClearError: () => void;
  onClose: () => void;
  isRateLimited: boolean;
}

export function ChatWindow({
  messages,
  isLoading,
  error,
  onSendMessage,
  onRate,
  onEmailSubmit,
  onClearError,
  onClose,
  isRateLimited,
}: ChatWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);

  // Escape key closes the chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus trap: auto-focus the textarea on mount
  useEffect(() => {
    const textarea = windowRef.current?.querySelector('textarea');
    textarea?.focus();
  }, []);

  return (
    <div
      ref={windowRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="widget-chat-title"
      class={cn(
        'fixed z-[9999]',
        'bg-widget-bg rounded-widget shadow-widget-lg',
        'flex flex-col overflow-hidden',
        'border border-widget-border',
        'widget-animate-slide-up',
        // Desktop
        'w-[400px] h-[600px] right-5 bottom-24',
        // Mobile: fullscreen
        'max-[500px]:w-full max-[500px]:h-full max-[500px]:inset-0 max-[500px]:rounded-none max-[500px]:bottom-0 max-[500px]:right-0',
      )}
    >
      <Header onClose={onClose} />
      <MessagesArea
        messages={messages}
        isLoading={isLoading}
        onRate={onRate}
        onEmailSubmit={onEmailSubmit}
      />
      <InputArea
        onSend={onSendMessage}
        isLoading={isLoading}
        isDisabled={isRateLimited}
        error={error}
        onClearError={onClearError}
      />
      <Footer />
    </div>
  );
}
