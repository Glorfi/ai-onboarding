import { authPaths } from '@/pages/auth';
import { APP_PATH, type IRouteConfig } from '@/shared/config';
import { ProtectedRoute } from './protectedRoute';
import { MainLayout } from '../layouts';
import { MainPage } from '@/pages/main';
import { SitesPage } from '@/pages/sites';

export const routes: IRouteConfig[] = [
  ...authPaths,
  {
    path: APP_PATH.MAIN,
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: APP_PATH.MAIN, element: <MainPage /> },
          { path: APP_PATH.SITES, element: <SitesPage /> },
        ],
      },
    ],
  },
];
