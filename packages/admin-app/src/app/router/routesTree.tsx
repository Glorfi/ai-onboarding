import { authPaths } from '@/pages/auth';
import { APP_PATH, type IRouteConfig } from '@/shared/config';
import { ProtectedRoute } from './protectedRoute';
import { MainPage } from '@/pages/main';

export const routes: IRouteConfig[] = [
  ...authPaths,
  {
    path: APP_PATH.MAIN,
    element: <ProtectedRoute />,
    children: [{ path: APP_PATH.MAIN, element: <MainPage /> }],
  },
];
