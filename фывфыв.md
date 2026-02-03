# AI Onboarding Assistant - Code Agent Context

## Project Overview
AI-powered SaaS onboarding platform: automated site crawling → knowledge base → interactive walkthroughs + AI chat widget.

**Target:** Early-stage SaaS (<$100K MRR, 1-5 team). **Pricing:** $29-99/month. **Timeline:** 6-week MVP.

## Tech Stack

### Monorepo (Turborepo)
```
packages/
├── backend/     → Node.js/TS + Express + Prisma
├── admin-app/   → React + Vite + TailwindCSS + FSD architecture
├── widget/      → Vanilla TS (zero deps, minified)
└── shared/      → Common types, DTOs, validation
```

### Infrastructure
- **DB:** PostgreSQL (Prisma ORM) + Redis (BullMQ)
- **Vector:** Pinecone (semantic search)
- **AI:** OpenAI embeddings + Claude API responses
- **Crawl:** Puppeteer (headless Chrome)

## Architecture Principles

### Clean Architecture (Backend)
```
domain/          → Entities, interfaces (IRepository, IService)
├── models/      → Core entities (User, Site, ApiKey, etc.)
├── repositories/→ Data access interfaces
└── services/    → Business logic interfaces

application/     → Use cases, service implementations
└── services/    → Business logic (AuthService, SiteService, etc.)

infrastructure/  → External integrations
├── database/    
│   ├── prisma/  → Schema files (*.prisma), migrations
│   └── repositories/ → PrismaXxxRepository implementations
└── http/        → Express routes, controllers, middleware
```

**Key Pattern:** Dependency injection via `tsyringe`. Controllers depend on service interfaces, services depend on repository interfaces.

### FSD Architecture (Admin App)
Feature-Sliced Design with strict isolation layers.

## Core Data Models

### PostgreSQL Schema (Prisma)
```typescript
User { id, email, passwordHash, createdAt, updatedAt }
OAuthAccount { id, userId, provider, providerId }
Site { 
  id, userId, url, domain, name?, 
  status: 'pending'|'crawling'|'active'|'error',
  triggerDelaySeconds: number (default: 5)
}
ApiKey { id, siteId (unique), key (unique), isActive, lastRegeneratedAt? }
WalkthroughStep { 
  id, siteId, version, stepOrder (1-5), 
  targetSelectors: string[], title, description, 
  position: 'top'|'bottom'|'left'|'right', isActive 
}
KnowledgeBase { id, siteId, pageUrl, content, vectorId, crawledAt }
CustomKnowledge { id, siteId, title, content, vectorId }
WidgetSession { id, siteId, sessionId, userEmail?, metadata: JSON }
ChatMessage { id, siteId, sessionId, message, response, responseTimeMs }
ChatRating { id, chatMessageId, rating: 1|-1, feedback? }
UnansweredQuestion { id, siteId, question, userEmail? }
Analytics { id, siteId, eventType, sessionId, metadata: JSON }
```

**Unique Constraints:**
- `ApiKey.siteId` → One key per site
- `Site.userId + domain` → One domain per user
- `WalkthroughStep.siteId + version + stepOrder`

### Pinecone Vectors
```typescript
{
  id: `${siteId}_${pageUrl}_${chunkIndex}`,
  values: number[], // 1536-dim embedding
  metadata: { siteId, pageUrl, content, heading?, source: 'crawled'|'custom' }
}
```

## Critical Workflows

### 1. Site Crawling (BullMQ Job)
```
Owner adds site → Job: crawlSiteJob(siteId)
1. Set Site.status = 'crawling'
2. Puppeteer: crawl (depth: 2, max: 50 pages, 30s timeout)
3. Extract clean content (remove nav/footer/scripts)
4. Chunk (500-1000 tokens, 50-token overlap)
5. OpenAI embed (text-embedding-3-small)
6. Upsert to Pinecone
7. AI analyzes structure → generate 5 WalkthroughSteps
8. Save steps to PostgreSQL
9. Set Site.status = 'active'

Estimated: 1-5 minutes
```

### 2. Chat Query Flow
```
Widget → POST /api/widget/chat
1. Rate limit check (Redis: 10 msg/hour per session)
2. Search Pinecone (query embedding, similarity > 0.7)
3. If no good match → save UnansweredQuestion, return fallback
4. If match → Build context from top 5 chunks
5. Claude API: generate answer (with context)
6. Save ChatMessage (message + response + responseTimeMs)
7. Return answer + allow rating

Widget displays:
- Answer + rating UI (👍/👎)
- If no answer: email collection form
```

### 3. API Key Validation (Middleware)
```typescript
validateApiKey(req.headers['x-api-key'], req.headers.origin)
→ Check ApiKey exists, isActive
→ Verify request domain matches Site.domain (prevent unauthorized use)
→ Attach siteId to req.context
```

## Key Services & Interfaces

### Backend Services (application/)
```typescript
IAuthService { register, login, validateToken }
ISiteService { createSite, getSites, updateTriggerSettings, deleteSite, triggerRecrawl }
IApiKeyService { generateKey, regenerateKey, validateKey }
ICrawlingService { startCrawl, getCrawlStatus }
IKnowledgeBaseService { addCustomKnowledge, search(siteId, query, topK=5) }
IChatService { handleChatMessage, saveChatRating, getUnansweredQuestions }
IAnalyticsService { trackEvent, getDashboardStats }
```

### Repositories (domain/repositories/)
All follow pattern: `IXxxRepository` interface → `PrismaXxxRepository` implementation

Critical methods:
- `IKnowledgeBaseRepository.findBySiteId()`
- `ISiteRepository.updateStatus(siteId, status)`
- `IChatMessageRepository.findBySessionId(sessionId)`

## Widget Implementation

### Embed Script
```html
<script src="https://cdn.yourapp.com/widget.js" data-api-key="sk_xxx"></script>
```

**Widget Flow:**
1. Auto-init: extract API key, generate/retrieve sessionId (localStorage)
2. Validate key → fetch Site config (triggerDelaySeconds)
3. Check localStorage flag: if new user + idle N seconds → show walkthrough
4. Render floating chat icon (bottom-right)
5. Chat open → send messages via `/api/widget/chat`
6. Track events: `walkthrough_started`, `chat_message`, etc.

**No external dependencies** → Pure TS compiled to vanilla JS.

## API Endpoints

### Admin (Auth required: JWT)
```
POST   /api/auth/register { email, password }
POST   /api/auth/login { email, password }
GET    /api/sites → List user sites
POST   /api/sites { url, name? } → Create + trigger crawl
PATCH  /api/sites/:id/trigger { delaySeconds }
DELETE /api/sites/:id
POST   /api/sites/:id/recrawl
GET    /api/sites/:id/analytics
POST   /api/sites/:id/custom-knowledge { title, content }
```

### Widget (Auth: x-api-key header)
```
POST   /api/widget/chat { message, sessionId }
POST   /api/widget/analytics { eventType, sessionId, metadata }
GET    /api/widget/config → Returns Site settings
POST   /api/widget/unanswered { question, email? }
POST   /api/widget/rating { chatMessageId, rating, feedback? }
```

## Environment Variables
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=onboarding-kb
JWT_SECRET=...
JWT_EXPIRES_IN=7d
NODE_ENV=development|production
PORT=3000
WIDGET_CDN_URL=https://cdn.yourapp.com
```

## Development Phases (Current State)

✅ **Phase 1 (Weeks 1-2):** Core infrastructure
- Monorepo + Turborepo config
- Prisma schema + migrations
- Express API structure
- Auth (register/login/JWT)
- Site CRUD operations

🟡 **Phase 2 (Weeks 2-3):** Crawling system (IN PROGRESS?)
- Puppeteer crawler
- BullMQ jobs
- OpenAI embeddings
- Pinecone integration
- Crawl status polling

⬜ **Phase 3:** Walkthrough generation + widget
⬜ **Phase 4:** Chat system
⬜ **Phase 5:** Admin dashboard
⬜ **Phase 6:** Polish + testing

## Code Quality Standards

- **TypeScript:** Strict mode enabled
- **Linting:** ESLint + Prettier
- **Testing:** Jest (unit), Playwright (E2E widget)
- **DI:** `tsyringe` for service injection
- **Validation:** Zod schemas at API boundaries
- **Errors:** Custom error classes (domain/errors/)
- **Logging:** Structured logs (consider Winston/Pino)

## Critical Implementation Notes

### Rate Limiting
- **Session-based:** 10 messages/hour (Redis counter)
- **API key-based:** 60 req/min per key
- Widget shows "Try again in X minutes" when hit

### Security
- API key validates request origin matches Site.domain
- Input validation: URL normalization, XSS prevention
- Transactions for multi-step DB ops
- JWT expiry: 7 days

### Widget Performance
- Minified bundle <50KB
- Lazy-load chat UI (only icon initially)
- Client-side rate limit warning (don't spam backend)

### AI Integration
- **Embeddings:** OpenAI text-embedding-3-small (cheap, fast)
- **Chat:** Claude API (higher quality than GPT-3.5)
- **Similarity threshold:** 0.7 (below → "no answer")
- **Context limit:** Top 5 chunks, ~2000 tokens max

## Common Patterns to Follow

### Service Implementation Example
```typescript
@injectable()
export class SiteService implements ISiteService {
  constructor(
    @inject('ISiteRepository') private siteRepo: ISiteRepository,
    @inject('ICrawlingService') private crawlingService: ICrawlingService
  ) {}
  
  async createSite(userId: string, url: string, name?: string): Promise<Site> {
    const domain = extractDomain(url);
    const site = await this.siteRepo.create({ userId, url, domain, name });
    await this.crawlingService.startCrawl(site.id); // Enqueue job
    return site;
  }
}
```

### Repository Implementation Example
```typescript
@injectable()
export class PrismaSiteRepository implements ISiteRepository {
  async findById(id: string): Promise<Site | null> {
    return prisma.site.findUnique({ where: { id } });
  }
  
  async updateStatus(id: string, status: SiteStatus): Promise<Site> {
    return prisma.site.update({ where: { id }, data: { status } });
  }
}
```

### Controller Pattern
```typescript
export class SiteController {
  constructor(private siteService: ISiteService) {}
  
  async createSite(req: Request, res: Response) {
    const { url, name } = req.body; // Already validated by middleware
    const userId = req.user!.id; // From auth middleware
    
    const site = await this.siteService.createSite(userId, url, name);
    res.status(201).json({ site });
  }
}
```

## File Structure Quick Reference

```
packages/backend/src/
├── domain/
│   ├── models/            → Entity interfaces
│   ├── repositories/      → IXxxRepository interfaces
│   ├── services/          → IXxxService interfaces
│   └── errors/            → Custom error classes
├── application/
│   └── services/          → Service implementations
├── infrastructure/
│   ├── database/
│   │   ├── prisma/        
│   │   │   ├── schema.prisma
│   │   │   ├── *.prisma   → Split schemas
│   │   │   └── migrations/
│   │   └── repositories/  → PrismaXxxRepository
│   └── http/
│       ├── routes/        → Express route definitions
│       ├── controllers/   → Route handlers
│       └── middleware/    → Auth, validation, error handling
└── index.ts               → App entry point

packages/admin-app/src/
├── app/                   → App initialization, providers
├── pages/                 → Route pages
├── widgets/               → Complex features
├── features/              → Isolated business features
├── entities/              → Business entities (sites, users)
└── shared/                → UI kit, utils

packages/widget/src/
├── core/                  → Widget initialization
├── components/            → UI components (chat, walkthrough)
└── services/              → API client, analytics
```

## When to Read Full Specs

**This file gives 90% of context for most tasks.** Read detailed specs when:
- `/mnt/project/CHAT_WIDGET_SPEC.md` → Chat flow, rating system, unanswered questions
- `/mnt/project/PROJECT_SPEC.md` → Full business requirements, deployment details

## Quick Decision Guide

**Adding new feature?**
1. Define interface in `domain/`
2. Implement in `application/services/`
3. Create repository if needed (interface + Prisma impl)
4. Add controller in `infrastructure/http/`
5. Register DI bindings

**Modifying schema?**
1. Update Prisma schema file
2. Run `npx prisma migrate dev --name <change_description>`
3. Update domain model interface
4. Update repository methods if needed

**Adding API endpoint?**
1. Define DTO in `shared/types/dto/`
2. Create Zod validation schema
3. Add controller method
4. Register route with validation middleware
5. Document in this file

---

**Last Updated:** Based on repository snapshot with Phase 1 completed, Phase 2 in progress.
