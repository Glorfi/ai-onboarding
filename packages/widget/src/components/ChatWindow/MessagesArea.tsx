import { useRef, useEffect } from 'preact/hooks';
import { Message } from './Message';
import { TypingIndicator } from './TypingIndicator';
import type { Message as MessageType } from '@/types';

interface MessagesAreaProps {
  messages: MessageType[];
  isLoading: boolean;
  onRate: (messageId: string, rating: 'positive' | 'negative', feedback?: string) => void;
  onEmailSubmit: (questionId: string, email: string) => Promise<void>;
}

export function MessagesArea({ messages, isLoading, onRate, onEmailSubmit }: MessagesAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or when loading state changes
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length, isLoading]);

  return (
    <div
      ref={scrollRef}
      class="flex-1 overflow-y-auto px-4 py-4"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {messages.map((msg) => (
        <Message
          key={msg.id}
          message={msg}
          onRate={onRate}
          onEmailSubmit={onEmailSubmit}
        />
      ))}
      {isLoading && <TypingIndicator />}
    </div>
  );
}
