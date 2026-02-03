import { cn } from '@/utils/cn';
import { RatingButtons } from './RatingButtons';
import { EmailForm } from './EmailForm';
import type { Message as MessageType } from '@/types';

interface MessageProps {
  message: MessageType;
  onRate: (messageId: string, rating: 'positive' | 'negative', feedback?: string) => void;
  onEmailSubmit: (questionId: string, email: string) => Promise<void>;
}

export function Message({ message, onRate, onEmailSubmit }: MessageProps) {
  const isBot = message.role === 'bot';

  return (
    <div
      class={cn(
        'group flex gap-3 mb-4',
        isBot ? 'flex-row' : 'flex-row-reverse',
      )}
    >
      {/* Bot avatar */}
      {isBot && (
        <div
          class="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </div>
      )}

      <div class={cn('flex flex-col max-w-[80%]', !isBot && 'items-end')}>
        {/* Message bubble */}
        <div
          class={cn(
            'px-4 py-3 break-words',
            isBot
              ? 'bg-widget-bot-msg-bg text-widget-bot-msg-text rounded-widget-message rounded-tl-sm'
              : 'bg-widget-user-msg-bg text-widget-user-msg-text rounded-widget-message rounded-tr-sm',
            message.status === 'error' && 'opacity-70',
          )}
        >
          <p class="text-sm whitespace-pre-wrap">{message.content}</p>

          {/* Sources */}
          {message.sources && message.sources.length > 0 && (
            <div class="mt-2 pt-2 border-t border-widget-border/50">
              <p class="text-[11px] text-widget-text-secondary mb-0.5">Sources:</p>
              {message.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[11px] text-primary hover:underline block truncate"
                >
                  {source.title || source.pageUrl}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Rating buttons (bot messages with messageId, not yet rated) */}
        {isBot && message.messageId && (
          <RatingButtons
            messageId={message.messageId}
            currentRating={message.rating}
            onRate={onRate}
          />
        )}

        {/* Email form for unanswered questions */}
        {isBot && message.canProvideEmail && message.unansweredQuestionId && !message.emailSubmitted && (
          <EmailForm
            questionId={message.unansweredQuestionId}
            onSubmit={onEmailSubmit}
          />
        )}

        {/* Timestamp */}
        <span class="text-[10px] text-widget-text-secondary mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {message.status === 'error' && ' · failed to send'}
        </span>
      </div>
    </div>
  );
}
