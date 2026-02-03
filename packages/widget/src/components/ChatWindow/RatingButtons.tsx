import { useState } from 'preact/hooks';
import { cn } from '@/utils/cn';
import type { RatingValue } from '@/types';

interface RatingButtonsProps {
  messageId: string;
  currentRating?: RatingValue;
  onRate: (messageId: string, rating: 'positive' | 'negative', feedback?: string) => void;
}

export function RatingButtons({ messageId, currentRating, onRate }: RatingButtonsProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (currentRating) {
    return (
      <div class="mt-1 text-[11px] text-widget-text-secondary">
        {currentRating === 'positive' ? 'Thanks for the feedback!' : 'Thanks for letting us know'}
      </div>
    );
  }

  if (showFeedback) {
    return (
      <div class="mt-2 p-2 bg-widget-bg rounded-widget-sm border border-widget-border">
        <textarea
          value={feedback}
          onInput={(e) => setFeedback((e.target as HTMLTextAreaElement).value)}
          placeholder="What could be improved? (optional)"
          class={cn(
            'w-full px-2 py-1 text-xs rounded-md border border-widget-border',
            'focus:outline-none focus:ring-1 focus:ring-primary',
            'resize-none bg-widget-bg text-widget-text',
          )}
          rows={2}
          aria-label="Feedback"
        />
        <div class="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={() => { setShowFeedback(false); setFeedback(''); }}
            class="px-2 py-1 text-xs text-widget-text-secondary hover:text-widget-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onRate(messageId, 'negative', feedback || undefined);
              setShowFeedback(false);
            }}
            class="px-2 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity" role="group" aria-label="Rate this response">
      <button
        type="button"
        onClick={() => onRate(messageId, 'positive')}
        class={cn(
          'p-1 rounded hover:bg-green-100 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-green-300',
        )}
        aria-label="Helpful"
      >
        <svg class="w-3.5 h-3.5 text-widget-text-secondary hover:text-green-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => setShowFeedback(true)}
        class={cn(
          'p-1 rounded hover:bg-red-100 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-red-300',
        )}
        aria-label="Not helpful"
      >
        <svg class="w-3.5 h-3.5 text-widget-text-secondary hover:text-red-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
        </svg>
      </button>
    </div>
  );
}
