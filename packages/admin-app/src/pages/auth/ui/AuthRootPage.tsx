import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui';

export default function AuthRootPage() {
  function handleGoogleButtonClick() {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      '/api/auth/oauth/google?redirect=true',
      'oauth-popup',
      `width=${width},height=${height},left=${left},top=${top},popup=yes`
    );

    // Listen for storage event from popup (works across origins)
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== 'oauth-result') return;

      const data = JSON.parse(event.newValue || '{}');
      if (data.type === 'oauth-success') {
        window.removeEventListener('storage', handleStorage);
        localStorage.removeItem('oauth-result');
        popup?.close();

        if (data.isNewUser) {
          window.location.href = '/onboarding';
        } else {
          window.location.href = '/';
        }
      }
    };

    window.addEventListener('storage', handleStorage);
  }

  return (
    <section className="w-full flex items-center justify-center h-dvh">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Sign in quickly using your Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 mt-4"
            onClick={handleGoogleButtonClick}
          >
            {/* <Icons.google className="w-5 h-5" /> */}
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
