export interface IUser {
  id: string;
  email: string | null;
  passwordHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserPublic = Omit<IUser, 'passwordHash'>;

export interface ICreateUserData {
  email?: string | null;
  passwordHash?: string | null;
}

export interface IUpdateUserData {
  email?: string | null;
  passwordHash?: string | null;
}
