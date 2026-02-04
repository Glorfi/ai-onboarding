import { useState } from 'preact/hooks';
import type { RatingValue } from '@/types';
import s from './RatingButtons.module.css';

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
      <div class={s.ratedText}>
        {currentRating === 'positive' ? 'Thanks for the feedback!' : 'Thanks for letting us know'}
      </div>
    );
  }

  if (showFeedback) {
    return (
      <div class={s.feedbackForm}>
        <textarea
          value={feedback}
          onInput={(e) => setFeedback((e.target as HTMLTextAreaElement).value)}
          placeholder="What could be improved? (optional)"
          class={s.feedbackTextarea}
          rows={2}
          aria-label="Feedback"
        />
        <div class={s.feedbackActions}>
          <button
            type="button"
            onClick={() => { setShowFeedback(false); setFeedback(''); }}
            class={s.cancelButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onRate(messageId, 'negative', feedback || undefined);
              setShowFeedback(false);
            }}
            class={s.submitButton}
          >
            Submit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class={s.buttonRow} role="group" aria-label="Rate this response">
      <button
        type="button"
        onClick={() => onRate(messageId, 'positive')}
        class={`${s.rateButton} ${s.rateButtonGreen}`}
        aria-label="Helpful"
      >
        <svg class={s.rateIcon} viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => setShowFeedback(true)}
        class={`${s.rateButton} ${s.rateButtonRed}`}
        aria-label="Not helpful"
      >
        <svg class={s.rateIcon} viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
        </svg>
      </button>
    </div>
  );
}
