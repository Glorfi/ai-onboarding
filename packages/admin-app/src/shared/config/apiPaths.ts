export const API_PATHS = {
  BASE: '/api',
  // AUTH
  AUTH_PASSWORD_SIGN_IN: '/auth/signin',
  AUTH_PASSWORD_SIGN_UP: '/auth/signup',
  AUTH_REFRESH_TOKENS: '/auth/refresh',

  // USER
  USERS_ME: 'users/me',

  // SITES
  SITES: 'sites',
  SITES_MINE: 'sites/mine',
  SITES_BY_ID: (id: string) => `sites/${id}`,
  SITES_CRAWL_STATUS: (id: string) => `sites/${id}/crawl-status`,
  SITES_RECRAWL: (id: string) => `sites/${id}/recrawl`,
};
