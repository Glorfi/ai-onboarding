import type { IUserPublic } from '../../entities';

export interface IGetCurrentUserResponse extends IUserPublic {
  displayName: string | null;
  avatarUrl: string | null;
}
