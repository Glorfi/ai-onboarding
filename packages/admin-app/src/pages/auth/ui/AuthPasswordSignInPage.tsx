import { APP_PATH } from '@/shared/config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/shared/ui';
import { Link, useNavigate } from 'react-router';
import { useSignInMutation } from '../api';
import { signInInputSchema, type ISignInInput } from '@ai-onboarding/shared';
import { getErrorMessage } from '@/shared/lib';
import { useEffect } from 'react';

export default function AuthPasswordSignInPage() {
  const [signIn, { error, isSuccess }] = useSignInMutation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ISignInInput>({
    resolver: zodResolver(signInInputSchema),
    reValidateMode: 'onChange',
  });

  async function onSubmit(payload: ISignInInput) {
    await signIn(payload).unwrap();
  }

  useEffect(() => {
    if (error) {
      const message = getErrorMessage(error);
      setError('root', { message });
    }
  }, [error, setError]);

  useEffect(() => {
    isSuccess && navigate(APP_PATH.MAIN, { replace: true });
  }, [isSuccess]);

  return (
    <section className="w-full flex items-center justify-center h-dvh">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Password Login</CardTitle>
          <CardDescription>
            Enter your email and password below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {errors.root && (
                <p className="text-sm text-red-500">{errors.root.message}</p>
              )}
            </div>

            <CardFooter className="flex max-w-full gap-2 px-0 pt-6">
              <Link to={APP_PATH.AUTH}>
                <Button type="button" variant="link">
                  Passwordless login
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
