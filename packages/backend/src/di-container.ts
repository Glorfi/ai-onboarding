import 'reflect-metadata';
import { container } from 'tsyringe';
import { PrismaUserRepository } from './infrastructure/database/repositories';
import { PasswordService, JwtService } from './domain/services';

export function initDI() {
  container.register('IUserRepository', {
    useClass: PrismaUserRepository,
  });

  container.registerSingleton('PasswordService', PasswordService);
  container.registerSingleton('JwtService', JwtService);

  console.log('Dependency Injection initialized');
}
