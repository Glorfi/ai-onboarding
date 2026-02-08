import type { IUserPublic, IOAuthAccount } from '@/domain/models';
import type {
  IUserDTO,
  IPasswordSignInResponse,
  IGetCurrentUserResponse,
} from '@ai-onboarding/shared';

export function toUserDTO(user: IUserPublic): IUserDTO {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toSignInResponse(
  user: IUserPublic,
  accessToken: string,
  refreshToken: string,
): IPasswordSignInResponse {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    accessToken,
    refreshToken,
  };
}

export function toCurrentUserResponse(
  user: IUserPublic,
  oauthAccount: IOAuthAccount,
): IGetCurrentUserResponse {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    displayName: oauthAccount.displayName,
    avatarUrl: oauthAccount.avatarUrl,
  };
}
