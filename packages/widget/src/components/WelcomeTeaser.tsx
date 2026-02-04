import s from './WelcomeTeaser.module.css';

interface WelcomeTeaserProps {
  onOpen: () => void;
  onDismiss: () => void;
}

export function WelcomeTeaser({ onOpen, onDismiss }: WelcomeTeaserProps) {
  return (
    <div
      class={s.container}
      role="status"
      aria-live="polite"
    >
      <button
        onClick={onDismiss}
        class={s.dismissButton}
        aria-label="Dismiss"
        type="button"
      >
        <svg class={s.dismissIcon} viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          <path d="M13.3 0.7a1 1 0 0 0-1.4 0L7 5.6 2.1 0.7a1 1 0 0 0-1.4 1.4L5.6 7 0.7 11.9a1 1 0 1 0 1.4 1.4L7 8.4l4.9 4.9a1 1 0 0 0 1.4-1.4L8.4 7l4.9-4.9a1 1 0 0 0 0-1.4z" />
        </svg>
      </button>

      <button
        onClick={onOpen}
        class={s.openButton}
        type="button"
      >
        <p class={s.text}>
          👋 Hi! Need help? Ask me anything!
        </p>
      </button>
    </div>
  );
}
