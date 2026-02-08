export interface IGetCurrentUserResponse {
  id: string;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
  displayName: string | null;
  avatarUrl: string | null;
}
