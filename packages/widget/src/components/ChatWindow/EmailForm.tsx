import { useState } from 'preact/hooks';
import s from './EmailForm.module.css';

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
    <form onSubmit={handleSubmit} class={s.form}>
      <label class={s.label}>
        Enter your email so our team can help you:
      </label>
      <div class={s.row}>
        <input
          type="email"
          value={email}
          onInput={(e) => { setEmail((e.target as HTMLInputElement).value); setError(null); }}
          placeholder="you@example.com"
          class={`${s.input} ${error ? s.inputError : ''}`}
          disabled={isSubmitting}
          aria-label="Email address"
          aria-invalid={!!error}
        />
        <button
          type="submit"
          disabled={isSubmitting || !email}
          class={s.submitButton}
        >
          {isSubmitting ? '...' : 'Submit'}
        </button>
      </div>
      {error && (
        <p class={s.errorText} role="alert">{error}</p>
      )}
    </form>
  );
}
