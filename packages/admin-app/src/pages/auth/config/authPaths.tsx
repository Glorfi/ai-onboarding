import { APP_PATH, type IRouteConfig } from '@/shared/config';
import { withSuspenseLazy } from '@/shared/ui';

export const AuthPasswordSignInPage = withSuspenseLazy(
  () => import('../ui/AuthPasswordSignInPage'),
);
export const AuthRootPage = withSuspenseLazy(
  () => import('../ui/AuthRootPage'),
);
export const AuthSuccessPage = withSuspenseLazy(
  () => import('../ui/AuthSuccessPage'),
);

export const authPaths: IRouteConfig[] = [
  { path: APP_PATH.AUTH, element: <AuthRootPage /> },
  { path: APP_PATH.AUTH_PASSWORD, element: <AuthPasswordSignInPage /> },
  { path: APP_PATH.AUTH_SUCCESS, element: <AuthSuccessPage /> },
];
