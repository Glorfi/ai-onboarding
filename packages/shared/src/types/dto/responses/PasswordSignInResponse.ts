export interface IPasswordSignInResponse {
  id: string;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
  accessToken: string;
  refreshToken: string;
}
