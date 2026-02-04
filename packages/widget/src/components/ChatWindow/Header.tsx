import s from './Header.module.css';

interface HeaderProps {
  onClose: () => void;
}

export function Header({ onClose }: HeaderProps) {
  return (
    <div class={s.header}>
      <h2 class={s.title} id="widget-chat-title">
        Chat with us
      </h2>
      <button
        onClick={onClose}
        class={s.closeButton}
        aria-label="Close chat"
        type="button"
      >
        <svg class={s.closeIcon} viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          <path d="M13.3 0.7a1 1 0 0 0-1.4 0L7 5.6 2.1 0.7a1 1 0 0 0-1.4 1.4L5.6 7 0.7 11.9a1 1 0 1 0 1.4 1.4L7 8.4l4.9 4.9a1 1 0 0 0 1.4-1.4L8.4 7l4.9-4.9a1 1 0 0 0 0-1.4z" />
        </svg>
      </button>
    </div>
  );
}
