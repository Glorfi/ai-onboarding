export interface IUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserPublic = Omit<IUser, 'passwordHash'>;

export interface ICreateUserData {
  email: string;
  passwordHash: string;
}

export interface IUpdateUserData {
  email?: string;
  passwordHash?: string;
}
