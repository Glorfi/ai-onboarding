import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';

export default function AuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const isNewUser = searchParams.get('isNewUser') === 'true';

    // Save result to localStorage for parent window to detect
    localStorage.setItem(
      'oauth-result',
      JSON.stringify({ type: 'oauth-success', isNewUser, timestamp: Date.now() })
    );

    // Try to close popup
    window.close();

    // Fallback: if window didn't close (not a popup), navigate directly
    setTimeout(() => {
      if (isNewUser) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }, 200);
  }, [searchParams, navigate]);

  return (
    <div className="flex h-dvh items-center justify-center text-sm text-muted-foreground">
      Signing you in…
    </div>
  );
}
