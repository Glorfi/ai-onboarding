import { IUser, ICreateUserData, IUpdateUserData } from '../models';

export interface IUserRepository {
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  create(data: ICreateUserData): Promise<IUser>;
  update(id: string, data: IUpdateUserData): Promise<IUser>;
  delete(id: string): Promise<boolean>;
}
