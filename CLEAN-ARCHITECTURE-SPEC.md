# TypeScript Clean Architecture - AI Agent Guide

> **Stack**: TypeScript, Express, Prisma, TSyringe DI
> **Last Updated**: 2025-01-26

## Architecture Layers

```
Interfaces → Application → Domain ← Infrastructure
   (HTTP)    (Use Cases)  (Business)  (Prisma/OAuth)
```

**Dependency Rules**:
- ✅ Outer → Inner dependencies only
- ✅ Infrastructure implements Domain interfaces
- ❌ Domain never depends on outer layers

---

## File Structure

```
src/
├── application/use-cases/        # Orchestration
│   └── {domain}/{Action}UseCase.ts
├── domain/
│   ├── models/                   # Interfaces (from shared package)
│   ├── repositories/             # I{Entity}Repository interfaces
│   ├── services/                 # Reusable business logic
│   └── errors/errorFactory.ts    # BusinessError, Errors.*
├── infrastructure/
│   ├── database/
│   │   ├── prisma.ts            # Prisma client
│   │   └── repositories/         # Prisma{Entity}Repository
│   ├── http/
│   │   ├── app.ts
│   │   ├── routes/
│   │   └── middlewares/
│   └── oauth/                    # OAuth providers
├── interfaces/controllers/       # HTTP handlers
├── di-container.ts              # DI registration
└── index.ts                     # Entry point
```

---

## Quick Patterns

### 1. Use Case Pattern

```typescript
// application/use-cases/user/RegisterUserUseCase.ts
import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '@/domain/repositories';
import { PasswordService } from '@/domain/services';
import { Errors } from '@/domain/errors';
import { registerInputSchema, IRegisterInput } from '@ai-onboarding/shared';

@injectable()
export class RegisterUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepo: IUserRepository,
    @inject('PasswordService') private passwordService: PasswordService
  ) {}

  async execute(input: IRegisterInput): Promise<IRegisterUserOutput> {
    // 1. Validate input
    const validated = registerInputSchema.parse(input);

    // 2. Check business rules
    const existing = await this.userRepo.findByEmail(validated.email);
    if (existing) throw Errors.emailAlreadyExists();

    // 3. Process business logic
    const passwordHash = await this.passwordService.hash(validated.password);

    // 4. Persist data
    const user = await this.userRepo.create({
      email: validated.email,
      passwordHash,
    });

    // 5. Return result
    const { passwordHash: _, ...userPublic } = user;
    return { user: userPublic };
  }
}
```

**Use Case Rules**:
- One `execute()` method
- Inject dependencies via constructor
- Validate at start (Zod from shared)
- Throw `Errors.*` for violations
- No try-catch (let errors bubble)
- Return domain models

---

### 2. Repository Interface

```typescript
// domain/repositories/IUserRepository.ts
import { IUser, ICreateUserData, IUpdateUserData } from '../models';

export interface IUserRepository {
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  create(data: ICreateUserData): Promise<IUser>;
  update(id: string, data: IUpdateUserData): Promise<IUser>;
  delete(id: string): Promise<boolean>;
}
```

---

### 3. Prisma Repository

```typescript
// infrastructure/database/repositories/PrismaUserRepository.ts
import { injectable } from 'tsyringe';
import { IUserRepository } from '@/domain/repositories';
import { IUser, ICreateUserData, IUpdateUserData } from '@/domain/models';
import { prisma } from '../prisma';

@injectable()
export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<IUser | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: ICreateUserData): Promise<IUser> {
    return prisma.user.create({ data });
  }

  async update(id: string, data: IUpdateUserData): Promise<IUser> {
    return prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
```

---

### 4. Domain Service

```typescript
// domain/services/PasswordService.ts
import * as bcrypt from 'bcryptjs';
import { injectable } from 'tsyringe';

@injectable()
export class PasswordService {
  private readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

**Service Rules**:
- Use `@injectable()` decorator
- No repository dependencies
- Stateless (no instance variables)
- Reusable across use cases

---

### 5. Error Factory

```typescript
// domain/errors/errorFactory.ts
export class BusinessError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

export const Errors = {
  validation: (msg: string) =>
    new BusinessError(msg, 'VALIDATION_ERROR', 400),
  
  unauthorized: (msg: string = 'Unauthorized') =>
    new BusinessError(msg, 'UNAUTHORIZED', 401),
  
  forbidden: (msg: string = 'Forbidden') =>
    new BusinessError(msg, 'FORBIDDEN', 403),
  
  notFound: (entity: string) =>
    new BusinessError(`${entity} not found`, 'NOT_FOUND', 404),
  
  conflict: (msg: string) =>
    new BusinessError(msg, 'CONFLICT', 409),
  
  emailAlreadyExists: () =>
    new BusinessError('User with this email already exists', 'EMAIL_EXISTS', 409),
};
```

---

### 6. Controller Pattern

```typescript
// interfaces/controllers/UserController.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { RegisterUserUseCase } from '@/application/use-cases';
import { JwtService } from '@/domain/services';

export class UserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = container.resolve(RegisterUserUseCase);
      const result = await useCase.execute(req.body);
      
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = container.resolve(SignInUserUseCase);
      const jwtService = container.resolve(JwtService);
      const result = await useCase.execute(req.body);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
      };

      res
        .cookie('accessToken', result.accessToken, {
          ...cookieOptions,
          maxAge: jwtService.getTokenMaxAge('access'),
        })
        .cookie('refreshToken', result.refreshToken, {
          ...cookieOptions,
          maxAge: jwtService.getTokenMaxAge('refresh'),
        })
        .json(result);
    } catch (error) {
      next(error);
    }
  }
}
```

**Controller Rules**:
- Static methods only
- Resolve use case from container
- Call `execute()` with request data
- Pass errors to `next()`

---

### 7. Routes

```typescript
// infrastructure/http/routes/auth.ts
import { Router } from 'express';
import { UserController } from '@/interfaces/controllers/UserController';
import { authMiddleware } from '../middlewares';

const router = Router();

router.post('/signup', UserController.register);
router.post('/signin', UserController.signIn);
router.get('/profile', authMiddleware, UserController.getProfile);

export default router;
```

---

### 8. Auth Middleware

```typescript
// infrastructure/http/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { JwtService } from '@/domain/services';

export interface IAuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const jwtService = container.resolve(JwtService);
    
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) token = req.cookies?.accessToken;
    
    if (!token) {
      res.status(401).json({ message: 'Token not provided', code: 'UNAUTHORIZED' });
      return;
    }

    const payload = jwtService.verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', code: 'UNAUTHORIZED' });
  }
}
```

---

### 9. Error Handler

```typescript
// infrastructure/http/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { BusinessError } from '@/domain/errors';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof BusinessError) {
    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  console.error('Unexpected error:', err);
  res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
```

---

### 10. DI Container

```typescript
// di-container.ts
import 'reflect-metadata';
import { container } from 'tsyringe';
import {
  PrismaUserRepository,
  PrismaOAuthAccountRepository,
} from './infrastructure/database/repositories';
import { PasswordService, JwtService } from './domain/services';
import {
  OAuthProviderRegistry,
  OAuthStateService,
  OAuthService,
  GoogleOAuthProvider,
} from './infrastructure/oauth';

export function initDI() {
  // Repositories
  container.register('IUserRepository', { useClass: PrismaUserRepository });
  container.register('IOAuthAccountRepository', { useClass: PrismaOAuthAccountRepository });

  // Services
  container.registerSingleton('PasswordService', PasswordService);
  container.registerSingleton('JwtService', JwtService);

  // OAuth
  container.registerSingleton('OAuthStateService', OAuthStateService);
  container.registerSingleton('OAuthProviderRegistry', OAuthProviderRegistry);
  container.registerSingleton('OAuthService', OAuthService);

  // Register OAuth providers
  const registry = container.resolve<OAuthProviderRegistry>('OAuthProviderRegistry');
  if (process.env.GOOGLE_CLIENT_ID) {
    registry.registerProvider(new GoogleOAuthProvider());
  }

  console.log('✅ DI initialized');
}
```

---

### 11. Express App Setup

```typescript
// infrastructure/http/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares';
import apiRoutes from './routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api', apiRoutes);
  app.use(errorHandler); // Must be last

  return app;
}
```

---

### 12. Entry Point

```typescript
// index.ts
import 'dotenv/config';
import { initDI } from './di-container';
import { createApp } from './infrastructure/http/app';
import { connectDatabase } from './infrastructure/database';

async function bootstrap() {
  try {
    initDI();
    await connectDatabase();

    const app = createApp();
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
```

---

## OAuth Pattern

### OAuth Provider Interface

```typescript
// domain/services/oauth/IOAuthProvider.ts
export interface IOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface IOAuthProvider {
  readonly provider: OAuthProvider;
  getAuthorizationUrl(state: string, redirectUri: string): string;
  exchangeCodeForTokens(code: string, redirectUri: string): Promise<IOAuthTokens>;
  getUserProfile(accessToken: string): Promise<IOAuthUserProfile>;
}
```

### OAuth Provider Implementation

```typescript
// infrastructure/oauth/providers/GoogleOAuthProvider.ts
import { injectable } from 'tsyringe';
import { IOAuthProvider } from '@/domain/services/oauth/IOAuthProvider';
import { OAuthProvider } from '@ai-onboarding/shared';

@injectable()
export class GoogleOAuthProvider implements IOAuthProvider {
  readonly provider = OAuthProvider.GOOGLE;
  
  private readonly clientId = process.env.GOOGLE_CLIENT_ID!;
  private readonly clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<IOAuthTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) throw new Error('Failed to exchange code');
    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  async getUserProfile(accessToken: string): Promise<IOAuthUserProfile> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error('Failed to fetch profile');
    const data = await response.json();
    
    return {
      providerAccountId: data.id,
      email: data.email || null,
      displayName: data.name || null,
      avatarUrl: data.picture || null,
    };
  }
}
```

---

## Key Rules

### DO ✅
- Validate input at use case start (Zod from shared)
- Throw `Errors.*` for business violations
- Use `@injectable()` for DI classes
- Repository interfaces in domain
- Models/types from shared package
- Static controller methods
- Pass errors to `next()` in controllers

### DON'T ❌
- Access database from use cases (use repositories)
- Handle HTTP in use cases (status codes, cookies)
- Catch errors in use cases (let bubble to errorHandler)
- Store state in use case/controller instances
- Import from outer layers in domain
- Create models in backend (use shared package)

---

## Common Patterns

### Pagination
```typescript
interface IPaginationParams { page: number; limit: number; }
interface IPaginatedResult<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number; };
}
```

### Transaction (Prisma)
```typescript
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.product.update({ where: { id }, data: { stock: newStock } });
  return order;
});
```

---

## Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-secret
ACCESS_TOKEN_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=14d
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:3001
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## Development Checklist

### New Entity
1. Add to shared package models
2. Create Prisma schema
3. Run migration
4. Create `I{Entity}Repository` in domain
5. Create `Prisma{Entity}Repository` in infrastructure
6. Register in `di-container.ts`

### New Use Case
1. Create in `application/use-cases/{domain}/`
2. Define input interface (or use from shared)
3. Inject dependencies via constructor
4. Implement `execute()` with validation
5. Throw `Errors.*` for violations

### New HTTP Endpoint
1. Create controller method in `interfaces/controllers/`
2. Add route in `infrastructure/http/routes/`
3. Add middleware if needed (auth, validation)
4. Test error handling

---

**End of Specification**
