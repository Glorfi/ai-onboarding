import { cn } from '@/utils/cn';

interface WelcomeTeaserProps {
  onOpen: () => void;
  onDismiss: () => void;
}

export function WelcomeTeaser({ onOpen, onDismiss }: WelcomeTeaserProps) {
  return (
    <div
      class={cn(
        'fixed right-5 bottom-[92px] z-[9999]',
        'bg-widget-bg rounded-widget shadow-widget-lg',
        'p-4 max-w-[280px]',
        'widget-animate-slide-up',
        'border border-widget-border',
      )}
      role="status"
      aria-live="polite"
    >
      <button
        onClick={onDismiss}
        class={cn(
          'absolute top-2 right-2',
          'w-6 h-6 flex items-center justify-center',
          'text-widget-text-secondary hover:text-widget-text',
          'rounded-full hover:bg-widget-border/50',
          'transition-colors',
        )}
        aria-label="Dismiss"
        type="button"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          <path d="M13.3 0.7a1 1 0 0 0-1.4 0L7 5.6 2.1 0.7a1 1 0 0 0-1.4 1.4L5.6 7 0.7 11.9a1 1 0 1 0 1.4 1.4L7 8.4l4.9 4.9a1 1 0 0 0 1.4-1.4L8.4 7l4.9-4.9a1 1 0 0 0 0-1.4z" />
        </svg>
      </button>

      <button
        onClick={onOpen}
        class="text-left w-full pr-4"
        type="button"
      >
        <p class="text-sm text-widget-text">
          👋 Hi! Need help? Ask me anything!
        </p>
      </button>
    </div>
  );
}
