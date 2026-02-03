import { useState } from 'preact/hooks';
import { cn } from '@/utils/cn';

interface EmailFormProps {
  questionId: string;
  onSubmit: (questionId: string, email: string) => Promise<void>;
}

export function EmailForm({ questionId, onSubmit }: EmailFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!isValidEmail) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(questionId, email);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      class="mt-3 p-3 bg-widget-bg rounded-widget-sm border border-widget-border"
    >
      <label class="block text-xs text-widget-text-secondary mb-1.5">
        Enter your email so our team can help you:
      </label>
      <div class="flex gap-2">
        <input
          type="email"
          value={email}
          onInput={(e) => { setEmail((e.target as HTMLInputElement).value); setError(null); }}
          placeholder="you@example.com"
          class={cn(
            'flex-1 px-3 py-2 text-sm rounded-widget-sm',
            'border bg-widget-bg text-widget-text',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-red-400' : 'border-widget-border',
          )}
          disabled={isSubmitting}
          aria-label="Email address"
          aria-invalid={!!error}
        />
        <button
          type="submit"
          disabled={isSubmitting || !email}
          class={cn(
            'px-4 py-2 text-sm font-medium text-white rounded-widget-sm',
            'bg-primary hover:bg-primary-hover',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors',
          )}
        >
          {isSubmitting ? '...' : 'Submit'}
        </button>
      </div>
      {error && (
        <p class="text-xs text-red-500 mt-1" role="alert">{error}</p>
      )}
    </form>
  );
}
