import s from './FloatingButton.module.css';

interface FloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function FloatingButton({ onClick, isOpen }: FloatingButtonProps) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      class={s.button}
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
      class={s.icon}
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
