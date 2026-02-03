import { cn } from '@/utils/cn';

interface HeaderProps {
  onClose: () => void;
}

export function Header({ onClose }: HeaderProps) {
  return (
    <div
      class={cn(
        'flex items-center justify-between',
        'px-4 py-3',
        'bg-widget-header-bg',
        'border-b border-widget-border',
        'rounded-t-widget',
      )}
    >
      <h2 class="text-base font-semibold text-widget-text" id="widget-chat-title">
        Chat with us
      </h2>
      <button
        onClick={onClose}
        class={cn(
          'w-8 h-8 flex items-center justify-center',
          'text-widget-text-secondary hover:text-widget-text',
          'rounded-full hover:bg-widget-border/50',
          'transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary/30',
        )}
        aria-label="Close chat"
        type="button"
      >
        <svg class="w-4 h-4" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          <path d="M13.3 0.7a1 1 0 0 0-1.4 0L7 5.6 2.1 0.7a1 1 0 0 0-1.4 1.4L5.6 7 0.7 11.9a1 1 0 1 0 1.4 1.4L7 8.4l4.9 4.9a1 1 0 0 0 1.4-1.4L8.4 7l4.9-4.9a1 1 0 0 0 0-1.4z" />
        </svg>
      </button>
    </div>
  );
}
