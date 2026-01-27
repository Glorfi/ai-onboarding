// import { useGetCurrentUserQuery } from '@/entities/user'
import { useRefreshTokensQuery } from '@/pages/auth';
// import { Spinner } from '@/shared/assets';
import { APP_PATH } from '@/shared/config';
import { Spinner } from '@/shared/ui';
import { Navigate, Outlet } from 'react-router';

export const ProtectedRoute = () => {
  const { isLoading, isError, error } = useRefreshTokensQuery();

  if (isLoading) {
    return (
      <div className="w-full h-dvh flex items-center justify-center">
        <Spinner className='size-20' />
      </div>
    );
  }
  if (isError && 'status' in error && error.status === 401) {
    return <Navigate to={APP_PATH.AUTH} replace />;
  }

  return <Outlet />;
};
