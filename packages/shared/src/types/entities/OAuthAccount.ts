export enum OAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  TELEGRAM = 'telegram',
  GITHUB = 'github',
  APPLE = 'apple',
}

export interface IOAuthAccount {
  id: string;
  userId: string;
  provider: OAuthProvider;
  providerAccountId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOAuthAccountData {
  userId: string;
  provider: OAuthProvider;
  providerAccountId: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface IUpdateOAuthAccountData {
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface IOAuthUserProfile {
  providerAccountId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}
