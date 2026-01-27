import { Navigate, Outlet } from 'react-router';
import { useRefreshTokensQuery } from '@/pages/auth';
import { Spinner } from '@/shared/ui';
import { APP_PATH } from '@/shared/config';

export const ProtectedRoute = () => {
  const { data, isLoading, isError, error } = useRefreshTokensQuery();

  // Пока идет запрос, показываем спиннер
  if (isLoading) {
    return (
      <section className="w-full h-dvh flex items-center justify-center">
        <Spinner className="size-20" />
      </section>
    );
  }
  if (isError && 'status' in error && error.status === 401) {
    return <Navigate to={APP_PATH.AUTH} replace />;
  }

  // Все ок — показываем вложенные маршруты
  return <Outlet />;
};
