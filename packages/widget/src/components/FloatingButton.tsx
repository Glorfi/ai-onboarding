import { cn } from '@/utils/cn';

interface FloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function FloatingButton({ onClick, isOpen }: FloatingButtonProps) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      class={cn(
        'fixed right-5 bottom-5 z-[9999]',
        'w-[60px] h-[60px] rounded-full',
        'bg-primary hover:bg-primary-hover',
        'shadow-widget-lg hover:scale-105',
        'flex items-center justify-center',
        'transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-primary/30',
        'widget-animate-bounce-in',
      )}
      aria-label="Open chat"
      aria-expanded={false}
      type="button"
    >
      <ChatIcon />
    </button>
  );
}

function ChatIcon() {
  return (
    <svg
      class="w-7 h-7 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
