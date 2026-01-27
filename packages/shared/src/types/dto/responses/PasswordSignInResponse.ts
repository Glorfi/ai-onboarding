import { IUserPublic } from '../../entities';

export interface IPasswordSignInResponse extends IUserPublic {
  accessToken: string;
  refreshToken: string;
}
