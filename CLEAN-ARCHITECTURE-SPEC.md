# TypeScript Backend - Clean Architecture Guide

> **Purpose**: AI-optimized reference for TypeScript backend development with Clean Architecture
> **Stack**: TypeScript, Express, MongoDB, TSyringe DI
> **Last Updated**: 2025-01-15

---

## 1. Quick Reference

**Architecture Pattern**: Clean Architecture (Domain-Driven Design)

**Layer Hierarchy**:
```
Interfaces → Application → Domain ← Infrastructure
   (HTTP)      (Use Cases)  (Business)  (MongoDB, External)
```

**Key Commands**:
```bash
npm run dev          # ts-node-dev (development)
npm run build        # tsc + tsc-alias (production)
npm run typecheck    # tsc --noEmit
```

**Project Structure**:
```
src/
├── application/use-cases/    # Orchestration logic
├── domain/                   # Business logic, entities, interfaces
├── infrastructure/           # External implementations (DB, HTTP)
├── interfaces/controllers/   # HTTP request handlers
├── shared/config.ts          # Application constants
├── di-container.ts           # Dependency injection setup
└── index.ts                  # App entry point
```

---

## 2. Clean Architecture Layers

### Layer Diagram
```
┌─────────────────────────────────────────────────────────┐
│  INTERFACES (Entry Points)                              │
│  • HTTP Controllers, CLI handlers, GraphQL resolvers    │
│  • Dependency: Application layer                        │
└──────────────────┬────────────────────────────────────┘
                   │ depends on ↓
┌──────────────────┴────────────────────────────────────┐
│  APPLICATION (Use Cases)                                │
│  • Business workflows, orchestration                    │
│  • Dependency: Domain interfaces                        │
└──────────────────┬────────────────────────────────────┘
                   │ depends on ↓
┌──────────────────┴────────────────────────────────────┐
│  DOMAIN (Core Business Logic)                           │
│  • Entities, Models, Repository Interfaces              │
│  • Services, Errors, Value Objects                      │
│  • No external dependencies                             │
└──────────────────┬────────────────────────────────────┘
                   ↑ implemented by
┌──────────────────┴────────────────────────────────────┐
│  INFRASTRUCTURE (Technical Details)                     │
│  • MongoDB repositories, HTTP setup                     │
│  • External APIs, File system, Message queues           │
│  • Implements Domain interfaces                         │
└─────────────────────────────────────────────────────────┘
```

### Dependency Rules

**✅ Allowed**:
- Outer layers depend on inner layers
- All layers depend on Domain
- Infrastructure implements Domain interfaces

**❌ Forbidden**:
- Domain depends on outer layers
- Inner layers import from outer layers
- Direct database access from Use Cases

---

## 3. Domain Layer

### 3.1 Models (Interfaces)

**Location**: `domain/models/{Entity}.ts`

**Purpose**: Define data structures without implementation

```typescript
// domain/models/User.ts
export interface IUser {
  _id?: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

// domain/models/Product.ts
export interface IProduct {
  _id?: string;
  name: string;
  price: number;
  stock: number;
  categoryId: string;
  isActive: boolean;
}
```

**Best Practices**:
- Optional `_id` (created by DB)
- Optional timestamps (handled by DB)
- Use TypeScript enums for fixed values
- Keep interfaces flat (no nested logic)

### 3.2 Entities (Business Logic)

**Location**: `domain/entities/{Entity}Entity.ts`

**Purpose**: Encapsulate business rules and validation

```typescript
// domain/entities/ProductEntity.ts
import { IProduct } from '../models/Product';

export class ProductEntity implements IProduct {
  _id?: string;
  name: string;
  price: number;
  stock: number;
  categoryId: string;
  isActive: boolean;

  constructor(data: IProduct) {
    this._id = data._id;
    this.name = data.name;
    this.price = data.price;
    this.stock = data.stock;
    this.categoryId = data.categoryId;
    this.isActive = data.isActive;
  }

  // Business logic methods
  public canBePurchased(quantity: number): boolean {
    return this.isActive && this.stock >= quantity;
  }

  public applyDiscount(percentage: number): number {
    if (percentage < 0 || percentage > 1) {
      throw new Error('Invalid discount percentage');
    }
    return this.price * (1 - percentage);
  }

  public reduceStock(quantity: number): void {
    if (!this.canBePurchased(quantity)) {
      throw new Error('Insufficient stock or inactive product');
    }
    this.stock -= quantity;
  }

  // Private helpers
  private calculateTax(): number {
    return this.price * 0.2; // 20% tax
  }
}
```

**Pattern**:
- Constructor maps all interface fields
- Public methods for business operations
- Private methods for internal calculations
- Throw errors for invalid states
- No database access (pure business logic)

### 3.3 Repository Interfaces

**Location**: `domain/repositories/{Entity}Repository.ts`

**Purpose**: Define data access contracts (implemented by Infrastructure)

```typescript
// domain/repositories/UserRepository.ts
import { IUser } from '../models/User';

export interface IUserRepository {
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  create(user: Partial<IUser>): Promise<IUser>;
  update(id: string, patch: Partial<IUser>): Promise<IUser>;
  delete(id: string): Promise<boolean>;
  findAll(filter?: Record<string, any>): Promise<IUser[]>;
}

// domain/repositories/ProductRepository.ts
export interface IProductRepository {
  findById(id: string): Promise<IProduct | null>;
  findByCategory(categoryId: string): Promise<IProduct[]>;
  create(product: Partial<IProduct>): Promise<IProduct>;
  update(id: string, patch: Partial<IProduct>): Promise<IProduct>;
  delete(id: string): Promise<boolean>;
  search(query: string): Promise<IProduct[]>;
}
```

**Naming Convention**:
- `I{Entity}Repository` interface
- Methods: `findBy*`, `create`, `update`, `delete`
- Return `Promise<T | null>` for single entities
- Return `Promise<T[]>` for collections

### 3.4 Services

**Location**: `domain/services/{Service}.ts`

**Purpose**: Reusable business logic shared across use cases

```typescript
// domain/services/PasswordService.ts
import * as bcrypt from 'bcryptjs';
import { injectable } from 'tsyringe';

@injectable()
export class PasswordService {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  validate(password: string): boolean {
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 number
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
  }
}

// domain/services/JwtService.ts
import * as jwt from 'jsonwebtoken';

@injectable()
export class JwtService {
  generateAccessToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '1d' }
    );
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '14d' }
    );
  }

  verifyAccessToken(token: string): { userId: string } {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string };
  }

  verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
  }
}
```

**Best Practices**:
- Use `@injectable()` decorator for DI
- No repository dependencies (pure logic)
- Reusable across multiple use cases
- Stateless (no instance variables)

### 3.5 Error Handling

**Location**: `domain/errors/errorFactory.ts`

**Purpose**: Centralized business error creation

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
  // 400 Bad Request
  validation: (msg: string) =>
    new BusinessError(msg, 'VALIDATION_ERROR', 400),

  // 401 Unauthorized
  unauthorized: (msg: string = 'Unauthorized') =>
    new BusinessError(msg, 'UNAUTHORIZED', 401),

  // 403 Forbidden
  forbidden: (msg: string = 'Forbidden') =>
    new BusinessError(msg, 'FORBIDDEN', 403),

  // 404 Not Found
  notFound: (entity: string) =>
    new BusinessError(`${entity} not found`, 'NOT_FOUND', 404),

  // 409 Conflict
  conflict: (msg: string) =>
    new BusinessError(msg, 'CONFLICT', 409),

  // 422 Unprocessable Entity
  invalidOperation: (msg: string) =>
    new BusinessError(msg, 'INVALID_OPERATION', 422),

  // 429 Too Many Requests
  limitExceeded: (msg: string) =>
    new BusinessError(msg, 'LIMIT_EXCEEDED', 429),
};
```

**Usage in Use Cases**:
```typescript
// Throw business errors
if (!user) throw Errors.notFound('User');
if (user.email === newEmail) throw Errors.conflict('Email already in use');
if (!passwordService.validate(password)) {
  throw Errors.validation('Password must be at least 8 characters');
}
```

---

## 4. Application Layer (Use Cases)

### 4.1 Use Case Pattern

**Location**: `application/use-cases/{domain}/{Action}{Entity}UseCase.ts`

**Structure**:
```typescript
// application/use-cases/user/RegisterUserUseCase.ts
import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '@/domain/repositories/UserRepository';
import { PasswordService } from '@/domain/services/PasswordService';
import { IUser } from '@/domain/models/User';
import { Errors } from '@/domain/errors/errorFactory';

export interface IRegisterUserInput {
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

@injectable()
export class RegisterUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepo: IUserRepository,
    @inject('PasswordService') private passwordService: PasswordService
  ) {}

  async execute(input: IRegisterUserInput): Promise<IUser> {
    // 1. Validate input
    if (!input.email || !input.password) {
      throw Errors.validation('Email and password are required');
    }

    if (!this.passwordService.validate(input.password)) {
      throw Errors.validation('Password must be at least 8 characters');
    }

    // 2. Check business rules
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw Errors.conflict('User with this email already exists');
    }

    // 3. Process business logic
    const passwordHash = await this.passwordService.hash(input.password);

    // 4. Persist data
    const user = await this.userRepo.create({
      email: input.email,
      passwordHash,
      role: input.role || 'user',
    });

    return user;
  }
}
```

### 4.2 Use Case Examples

**Create Entity**:
```typescript
// application/use-cases/product/CreateProductUseCase.ts
@injectable()
export class CreateProductUseCase {
  constructor(
    @inject('IProductRepository') private productRepo: IProductRepository,
    @inject('ICategoryRepository') private categoryRepo: ICategoryRepository
  ) {}

  async execute(input: ICreateProductInput): Promise<IProduct> {
    // Validate category exists
    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) throw Errors.notFound('Category');

    // Validate price
    if (input.price <= 0) {
      throw Errors.validation('Price must be positive');
    }

    return this.productRepo.create({
      name: input.name,
      price: input.price,
      stock: input.stock || 0,
      categoryId: input.categoryId,
      isActive: true,
    });
  }
}
```

**Update Entity**:
```typescript
// application/use-cases/product/UpdateProductUseCase.ts
@injectable()
export class UpdateProductUseCase {
  constructor(
    @inject('IProductRepository') private productRepo: IProductRepository
  ) {}

  async execute(id: string, patch: Partial<IProduct>): Promise<IProduct> {
    const product = await this.productRepo.findById(id);
    if (!product) throw Errors.notFound('Product');

    // Business validation
    if (patch.price !== undefined && patch.price <= 0) {
      throw Errors.validation('Price must be positive');
    }

    return this.productRepo.update(id, patch);
  }
}
```

**Complex Business Logic**:
```typescript
// application/use-cases/order/PlaceOrderUseCase.ts
@injectable()
export class PlaceOrderUseCase {
  constructor(
    @inject('IOrderRepository') private orderRepo: IOrderRepository,
    @inject('IProductRepository') private productRepo: IProductRepository,
    @inject('IUserRepository') private userRepo: IUserRepository
  ) {}

  async execute(input: IPlaceOrderInput): Promise<IOrder> {
    // 1. Validate user
    const user = await this.userRepo.findById(input.userId);
    if (!user) throw Errors.notFound('User');

    // 2. Validate products and stock
    const products = await Promise.all(
      input.items.map(item => this.productRepo.findById(item.productId))
    );

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const item = input.items[i];

      if (!product) throw Errors.notFound('Product');

      const entity = new ProductEntity(product);
      if (!entity.canBePurchased(item.quantity)) {
        throw Errors.invalidOperation(
          `Insufficient stock for ${product.name}`
        );
      }
    }

    // 3. Calculate total
    const total = input.items.reduce((sum, item, i) => {
      return sum + products[i]!.price * item.quantity;
    }, 0);

    // 4. Create order
    const order = await this.orderRepo.create({
      userId: input.userId,
      items: input.items,
      total,
      status: 'pending',
    });

    // 5. Update stock
    for (let i = 0; i < products.length; i++) {
      const product = products[i]!;
      const entity = new ProductEntity(product);
      entity.reduceStock(input.items[i].quantity);

      await this.productRepo.update(product._id!, {
        stock: entity.stock,
      });
    }

    return order;
  }
}
```

### 4.3 Use Case Best Practices

**DO**:
- ✅ One public `execute()` method per use case
- ✅ Inject dependencies via constructor
- ✅ Validate input at the start
- ✅ Throw BusinessError for violations
- ✅ Use entities for complex business logic
- ✅ Return domain models (not DTOs)

**DON'T**:
- ❌ Access database directly (use repositories)
- ❌ Handle HTTP concerns (status codes, headers)
- ❌ Catch errors (let them bubble up)
- ❌ Have multiple public methods
- ❌ Store state in use case instances

---

## 5. Infrastructure Layer

### 5.1 MongoDB Repository Implementation

**Location**: `infrastructure/mongodb/Mongo{Entity}Repository.ts`

**Pattern**:
```typescript
// infrastructure/mongodb/MongoUserRepository.ts
import { injectable, inject } from 'tsyringe';
import { Connection, Model, Types } from 'mongoose';
import { IUserRepository } from '@/domain/repositories/UserRepository';
import { IUser } from '@/domain/models/User';
import { UserSchema } from './schemas/UserSchema';

@injectable()
export class MongoUserRepository implements IUserRepository {
  private model: Model<IUser>;

  constructor(@inject('MongoConnection') private connection: Connection) {
    this.model = connection.model<IUser>('User', UserSchema);
  }

  async findById(id: string): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean().exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.model.findOne({ email }).lean().exec();
  }

  async create(user: Partial<IUser>): Promise<IUser> {
    const doc = await this.model.create(user);
    return doc.toObject();
  }

  async update(id: string, patch: Partial<IUser>): Promise<IUser> {
    const doc = await this.model
      .findByIdAndUpdate(id, patch, { new: true })
      .lean()
      .exec();

    if (!doc) throw new Error('User not found');
    return doc;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async findAll(filter: Record<string, any> = {}): Promise<IUser[]> {
    return this.model.find(filter).lean().exec();
  }
}
```

**Critical Patterns**:
- Always use `.lean()` for plain objects (performance)
- Validate ObjectId before queries
- Use `{ new: true }` for updates to return updated doc
- Throw errors on required operations (update, delete)
- Return `null` for optional operations (findById)

### 5.2 Mongoose Schemas

**Location**: `infrastructure/mongodb/schemas/{Entity}Schema.ts`

```typescript
// infrastructure/mongodb/schemas/UserSchema.ts
import { Schema } from 'mongoose';
import { IUser } from '@/domain/models/User';

export const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Indexes
UserSchema.index({ email: 1 });

// infrastructure/mongodb/schemas/ProductSchema.ts
export const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    categoryId: { type: Schema.Types.ObjectId, required: true, ref: 'Category' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

// Indexes
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ name: 'text' }); // For text search
```

**Best Practices**:
- Enable `timestamps: true` (auto createdAt/updatedAt)
- Set explicit `collection` name
- Add indexes for frequently queried fields
- Use `ref` for relationships
- Set `min/max` for number validation

### 5.3 Database Connection

**Location**: `infrastructure/mongodb/connector.ts`

```typescript
// infrastructure/mongodb/connector.ts
import mongoose, { Connection } from 'mongoose';

export class MongoDBConnection {
  private static instance: Connection | null = null;

  static async connect(uri: string): Promise<Connection> {
    if (this.instance) return this.instance;

    try {
      await mongoose.connect(uri);
      this.instance = mongoose.connection;
      console.log('✅ MongoDB connected');
      return this.instance;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await mongoose.disconnect();
      this.instance = null;
      console.log('🔌 MongoDB disconnected');
    }
  }
}
```

---

## 6. Interfaces Layer (HTTP)

### 6.1 Controller Pattern

**Location**: `interfaces/controllers/{Entity}Controller.ts`

```typescript
// interfaces/controllers/UserController.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { RegisterUserUseCase } from '@/application/use-cases/user/RegisterUserUseCase';
import { SignInUserUseCase } from '@/application/use-cases/user/SignInUserUseCase';

export class UserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = container.resolve(RegisterUserUseCase);
      const user = await useCase.execute(req.body);

      // Don't send passwordHash to client
      const { passwordHash, ...userDto } = user;

      res.status(201).json(userDto);
    } catch (error) {
      next(error); // Pass to error handler middleware
    }
  }

  static async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = container.resolve(SignInUserUseCase);
      const result = await useCase.execute(req.body);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = container.resolve(GetUserByIdUseCase);
      const user = await useCase.execute(req.params.id);

      const { passwordHash, ...userDto } = user;
      res.status(200).json(userDto);
    } catch (error) {
      next(error);
    }
  }
}
```

**Pattern**:
- Static methods (no instance state)
- Resolve use case from DI container
- Call `useCase.execute()` with input
- Send JSON response
- Pass errors to `next()` middleware

### 6.2 Routes

**Location**: `infrastructure/http/routes/{entity}.ts`

```typescript
// infrastructure/http/routes/users.ts
import { Router } from 'express';
import { UserController } from '@/interfaces/controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Public routes
router.post('/register', UserController.register);
router.post('/sign-in', UserController.signIn);

// Protected routes
router.get('/:id', authMiddleware, UserController.getById);
router.put('/:id', authMiddleware, UserController.update);
router.delete('/:id', authMiddleware, UserController.delete);

export default router;
```

### 6.3 Authentication Middleware

**Location**: `infrastructure/http/middlewares/authMiddleware.ts`

```typescript
// infrastructure/http/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { JwtService } from '@/domain/services/JwtService';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const jwtService = container.resolve(JwtService);

    // Try Bearer token first
    let token = req.headers.authorization?.split(' ')[1];

    // Fallback to cookie
    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        message: 'Access token not provided',
        code: 'UNAUTHORIZED',
      });
    }

    const payload = jwtService.verifyAccessToken(token);
    req.userId = payload.userId;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token',
      code: 'UNAUTHORIZED',
    });
  }
}
```

### 6.4 Error Handler Middleware

**Location**: `infrastructure/http/middlewares/errorHandler.ts`

```typescript
// infrastructure/http/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { BusinessError } from '@/domain/errors/errorFactory';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Business errors (known errors)
  if (err instanceof BusinessError) {
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: err.message,
      code: 'VALIDATION_ERROR',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Invalid or expired token',
      code: 'UNAUTHORIZED',
    });
  }

  // Unknown errors
  console.error('Unexpected error:', err);
  return res.status(500).json({
    message: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
  });
}
```

### 6.5 Express App Setup

**Location**: `infrastructure/http/app.ts`

```typescript
// infrastructure/http/app.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/errorHandler';

// Routes
import userRoutes from './routes/users';
import productRoutes from './routes/products';

export function createApp() {
  const app = express();

  // Middlewares
  app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // Routes
  app.use('/api/users', userRoutes);
  app.use('/api/products', productRoutes);

  // Health check
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
```

---

## 7. Dependency Injection Setup

### 7.1 DI Container

**Location**: `di-container.ts`

```typescript
// di-container.ts
import 'reflect-metadata';
import { container } from 'tsyringe';
import { MongoDBConnection } from './infrastructure/mongodb/connector';

// Repository implementations
import { MongoUserRepository } from './infrastructure/mongodb/MongoUserRepository';
import { MongoProductRepository } from './infrastructure/mongodb/MongoProductRepository';

export async function initDI() {
  // 1. Connect to MongoDB
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/myapp';
  const connection = await MongoDBConnection.connect(mongoUri);

  // 2. Register MongoDB connection
  container.registerInstance('MongoConnection', connection);

  // 3. Register repositories (Interface → Implementation)
  container.register('IUserRepository', {
    useClass: MongoUserRepository,
  });
  container.register('IProductRepository', {
    useClass: MongoProductRepository,
  });

  // 4. Register services (Class → Class, auto-injectable)
  // Services with @injectable() are auto-registered when resolved

  console.log('✅ Dependency Injection initialized');
}
```

**Registration Patterns**:
```typescript
// Interface token → Implementation
container.register('IRepository', { useClass: MongoRepository });

// Singleton service
container.registerSingleton('ServiceName', ServiceClass);

// Instance (for external connections)
container.registerInstance('TokenName', instance);
```

### 7.2 App Entry Point

**Location**: `index.ts`

```typescript
// index.ts
import 'dotenv/config';
import { initDI } from './di-container';
import { createApp } from './infrastructure/http/app';

async function bootstrap() {
  try {
    // 1. Initialize DI
    await initDI();

    // 2. Create Express app
    const app = createApp();

    // 3. Start server
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

## 8. Authentication Flow

### 8.1 Sign In Use Case

```typescript
// application/use-cases/user/SignInUserUseCase.ts
import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '@/domain/repositories/UserRepository';
import { PasswordService } from '@/domain/services/PasswordService';
import { JwtService } from '@/domain/services/JwtService';
import { Errors } from '@/domain/errors/errorFactory';

export interface ISignInInput {
  email: string;
  password: string;
}

export interface ISignInOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    email: string;
    role: string;
  };
}

@injectable()
export class SignInUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepo: IUserRepository,
    @inject('PasswordService') private passwordService: PasswordService,
    @inject('JwtService') private jwtService: JwtService
  ) {}

  async execute(input: ISignInInput): Promise<ISignInOutput> {
    // 1. Find user
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw Errors.unauthorized('Invalid email or password');
    }

    // 2. Verify password
    const isValid = await this.passwordService.compare(
      input.password,
      user.passwordHash
    );
    if (!isValid) {
      throw Errors.unauthorized('Invalid email or password');
    }

    // 3. Generate tokens
    const accessToken = this.jwtService.generateAccessToken(user._id!);
    const refreshToken = this.jwtService.generateRefreshToken(user._id!);

    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id!,
        email: user.email,
        role: user.role,
      },
    };
  }
}
```

### 8.2 Token Refresh Use Case

```typescript
// application/use-cases/user/RefreshTokensUseCase.ts
@injectable()
export class RefreshTokensUseCase {
  constructor(
    @inject('IUserRepository') private userRepo: IUserRepository,
    @inject('JwtService') private jwtService: JwtService
  ) {}

  async execute(refreshToken: string): Promise<{ accessToken: string }> {
    // 1. Verify refresh token
    let payload: { userId: string };
    try {
      payload = this.jwtService.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw Errors.unauthorized('Invalid refresh token');
    }

    // 2. Check user still exists
    const user = await this.userRepo.findById(payload.userId);
    if (!user) {
      throw Errors.unauthorized('User not found');
    }

    // 3. Generate new access token
    const accessToken = this.jwtService.generateAccessToken(user._id!);

    return { accessToken };
  }
}
```

---

## 9. Validation

### 9.1 Input Validation Pattern

**Option 1: Manual Validation**
```typescript
// application/use-cases/product/CreateProductUseCase.ts
async execute(input: ICreateProductInput): Promise<IProduct> {
  // Manual validation
  if (!input.name || input.name.trim().length === 0) {
    throw Errors.validation('Product name is required');
  }

  if (input.price <= 0) {
    throw Errors.validation('Price must be positive');
  }

  if (input.stock < 0) {
    throw Errors.validation('Stock cannot be negative');
  }

  // ... rest of use case
}
```

**Option 2: Zod Schema Validation**
```typescript
// application/use-cases/product/CreateProductUseCase.ts
import { z } from 'zod';

const CreateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  categoryId: z.string().min(1, 'Category is required'),
});

@injectable()
export class CreateProductUseCase {
  async execute(input: ICreateProductInput): Promise<IProduct> {
    // Validate with Zod
    const validated = CreateProductSchema.parse(input); // Throws if invalid

    // ... rest of use case
  }
}
```

### 9.2 Validation Middleware (Optional)

```typescript
// infrastructure/http/middlewares/validateRequest.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors,
          code: 'VALIDATION_ERROR',
        });
      }
      next(error);
    }
  };
}

// Usage in routes
router.post(
  '/products',
  validateRequest(CreateProductSchema),
  ProductController.create
);
```

---

## 10. Common Patterns

### 10.1 Pagination

```typescript
// domain/models/Pagination.ts
export interface IPaginationParams {
  page: number;
  limit: number;
}

export interface IPaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// domain/repositories/ProductRepository.ts
export interface IProductRepository {
  findPaginated(
    filter: Record<string, any>,
    pagination: IPaginationParams
  ): Promise<IPaginatedResult<IProduct>>;
}

// infrastructure/mongodb/MongoProductRepository.ts
async findPaginated(
  filter: Record<string, any>,
  pagination: IPaginationParams
): Promise<IPaginatedResult<IProduct>> {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.model.find(filter).skip(skip).limit(limit).lean().exec(),
    this.model.countDocuments(filter).exec(),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### 10.2 Soft Delete

```typescript
// domain/models/User.ts
export interface IUser {
  _id?: string;
  email: string;
  passwordHash: string;
  isDeleted: boolean;
  deletedAt?: Date;
}

// infrastructure/mongodb/MongoUserRepository.ts
async delete(id: string): Promise<boolean> {
  const result = await this.model
    .findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
    })
    .exec();

  return !!result;
}

async findById(id: string): Promise<IUser | null> {
  return this.model.findOne({ _id: id, isDeleted: false }).lean().exec();
}
```

### 10.3 Transactions

```typescript
// application/use-cases/order/PlaceOrderUseCase.ts
import { ClientSession } from 'mongoose';

@injectable()
export class PlaceOrderUseCase {
  constructor(
    @inject('IOrderRepository') private orderRepo: IOrderRepository,
    @inject('IProductRepository') private productRepo: IProductRepository,
    @inject('MongoConnection') private connection: Connection
  ) {}

  async execute(input: IPlaceOrderInput): Promise<IOrder> {
    const session: ClientSession = await this.connection.startSession();

    try {
      session.startTransaction();

      // 1. Create order (within transaction)
      const order = await this.orderRepo.create(
        { ...orderData },
        { session }
      );

      // 2. Update stock (within transaction)
      await this.productRepo.update(
        productId,
        { stock: newStock },
        { session }
      );

      await session.commitTransaction();
      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
```

---

## 11. File Organization Reference

```
project-root/
├── src/
│   ├── application/
│   │   └── use-cases/
│   │       ├── user/
│   │       │   ├── RegisterUserUseCase.ts
│   │       │   ├── SignInUserUseCase.ts
│   │       │   └── RefreshTokensUseCase.ts
│   │       └── product/
│   │           ├── CreateProductUseCase.ts
│   │           ├── UpdateProductUseCase.ts
│   │           └── DeleteProductUseCase.ts
│   │
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── UserEntity.ts
│   │   │   └── ProductEntity.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Product.ts
│   │   │   └── Pagination.ts
│   │   ├── repositories/
│   │   │   ├── UserRepository.ts
│   │   │   └── ProductRepository.ts
│   │   ├── services/
│   │   │   ├── PasswordService.ts
│   │   │   └── JwtService.ts
│   │   └── errors/
│   │       └── errorFactory.ts
│   │
│   ├── infrastructure/
│   │   ├── http/
│   │   │   ├── app.ts
│   │   │   ├── routes/
│   │   │   │   ├── users.ts
│   │   │   │   └── products.ts
│   │   │   └── middlewares/
│   │   │       ├── authMiddleware.ts
│   │   │       ├── errorHandler.ts
│   │   │       └── validateRequest.ts
│   │   └── mongodb/
│   │       ├── connector.ts
│   │       ├── MongoUserRepository.ts
│   │       ├── MongoProductRepository.ts
│   │       └── schemas/
│   │           ├── UserSchema.ts
│   │           └── ProductSchema.ts
│   │
│   ├── interfaces/
│   │   └── controllers/
│   │       ├── UserController.ts
│   │       └── ProductController.ts
│   │
│   ├── shared/
│   │   └── config.ts
│   │
│   ├── di-container.ts
│   └── index.ts
│
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 12. TypeScript Configuration

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**package.json scripts**:
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only -r tsconfig-paths/register src/index.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "tsyringe": "^4.8.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "cookie-parser": "^1.4.6",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",
    "@types/cookie-parser": "^1.4.6",
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0",
    "tsconfig-paths": "^4.2.0",
    "tsc-alias": "^1.8.8",
    "reflect-metadata": "^0.2.1"
  }
}
```

---

## 13. Environment Variables

**.env**:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://127.0.0.1:27017/myapp

# JWT
JWT_ACCESS_SECRET=your-access-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here

# CORS
FRONTEND_URL=http://localhost:3060
```

---

## 14. Development Checklist

### Adding New Entity

- [ ] Create `domain/models/{Entity}.ts` interface
- [ ] Create `domain/repositories/{Entity}Repository.ts` interface
- [ ] Create `infrastructure/mongodb/schemas/{Entity}Schema.ts`
- [ ] Create `infrastructure/mongodb/Mongo{Entity}Repository.ts`
- [ ] Register repository in `di-container.ts`
- [ ] Create entity class if complex business logic needed

### Adding New Use Case

- [ ] Create `application/use-cases/{domain}/{Action}{Entity}UseCase.ts`
- [ ] Define input interface
- [ ] Inject required dependencies
- [ ] Implement `execute()` method with validation
- [ ] Throw BusinessError for violations

### Adding New HTTP Endpoint

- [ ] Create controller method in `interfaces/controllers/{Entity}Controller.ts`
- [ ] Add route in `infrastructure/http/routes/{entity}.ts`
- [ ] Add authentication middleware if needed
- [ ] Add validation middleware if needed

---

## 15. Best Practices Summary

### Architecture
- ✅ Domain layer has no external dependencies
- ✅ Use cases orchestrate, don't contain business logic
- ✅ Entities contain business rules
- ✅ Infrastructure implements domain interfaces
- ✅ Controllers only handle HTTP concerns

### Code Quality
- ✅ Use TypeScript strict mode
- ✅ Use `@injectable()` for DI classes
- ✅ Use `async/await` instead of callbacks
- ✅ Always use `.lean()` with Mongoose queries
- ✅ Validate ObjectId before database queries

### Error Handling
- ✅ Throw BusinessError from domain/application
- ✅ Never catch errors in use cases
- ✅ Let errors bubble to error handler middleware
- ✅ Return appropriate HTTP status codes

### Security
- ✅ Hash passwords with bcrypt
- ✅ Use JWT for authentication
- ✅ Validate all user input
- ✅ Never expose sensitive data (passwordHash)
- ✅ Use CORS with specific origins

---

**End of Documentation**

> This guide provides patterns for Clean Architecture backend development in TypeScript. Apply these patterns consistently across your codebase for maintainability and scalability.
