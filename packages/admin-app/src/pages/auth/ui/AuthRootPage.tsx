import { useReduxToast } from '@/shared/lib';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui';

export default function AuthRootPage() {
  const { toast } = useReduxToast();
  function handleGoogleButtonClick() {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      '/api/auth/oauth/google?redirect=true',
      'oauth-popup',
      `width=${width},height=${height},left=${left},top=${top},popup=yes`,
    );

    // Poll localStorage for oauth result (more reliable than storage event)
    const checkInterval = setInterval(() => {
      const result = localStorage.getItem('oauth-result');
      if (!result) return;

      try {
        const data = JSON.parse(result);
        if (data.type === 'oauth-success') {
          clearInterval(checkInterval);
          localStorage.removeItem('oauth-result');
          popup?.close();

          // Даём браузеру время синхронизировать cookies между окнами
          setTimeout(() => {
            if (data.isNewUser) {
              window.location.href = '/onboarding';
            } else {
              window.location.href = '/';
            }
          }, 300);
        }
      } catch {
        // Invalid JSON, ignore
      }
    }, 100);

    // Stop polling after 5 minutes (cleanup for edge cases)
    setTimeout(() => clearInterval(checkInterval), 5 * 60 * 1000);
  }

  return (
    <section className="w-full min-h-dvh flex items-center justify-center ">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Welcome to AI Onboarding Assistant
          </CardTitle>
          <CardDescription className="mt-2">
            Turn first-time visitors into loyal users—automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center mt-6">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 py-3 text-lg font-medium"
            onClick={handleGoogleButtonClick}
          >
            {/* <Icons.google className="w-5 h-5" /> */}
            Continue with Google
          </Button>

          <ul className="mt-3 space-y-2 text-sm text-accent-foreground ">
            <li>✅ Auto-generated interactive walkthroughs</li>
            <li>✅ AI-powered contextual chat for your users</li>
            <li>✅ Easy setup in minutes—no coding required</li>
          </ul>
        </CardContent>
        <CardFooter className="text-center mt-4 text-xs text-gray-400">
          By continuing, you agree to our{' '}
          <a href="#" className="underline">
            Terms of Service
          </a>
          .
        </CardFooter>
      </Card>
    </section>
  );
}
