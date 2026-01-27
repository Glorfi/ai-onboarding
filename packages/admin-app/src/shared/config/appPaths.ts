export type IRouteConfig = {
  path?: string;
  element: React.ReactNode;
  index?: boolean;
  children?: IRouteConfig[];
};

export const APP_PATH = {
  MAIN: '/',
  //AUTH
  AUTH: '/auth',
  AUTH_PASSWORD: '/auth/password',
  AUTH_SUCCESS: '/auth/success',
} as const;
