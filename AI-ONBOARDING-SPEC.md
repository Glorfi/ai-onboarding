# AI-Powered Onboarding Assistant - Project Specification

## Project Overview

**Product Name:** AI Onboarding Assistant  
**Target Market:** Early-stage SaaS companies (<$100K MRR, 1-5 team members)  
**Core Problem:** 40-60% of SaaS signups use product once and never return due to poor onboarding  
**Solution:** Automated AI-powered onboarding with interactive walkthroughs and intelligent chat support  
**Pricing Target:** $29-99/month

## MVP Scope (6 weeks)

### Core Features
1. **Site Crawling & Knowledge Base Generation**
   - Automated web crawling with Puppeteer
   - AI-powered content extraction and embedding
   - Vector database storage for semantic search

2. **Interactive Walkthrough**
   - Auto-generated 5-step walkthroughs based on site structure
   - Smart element targeting with fallback selectors
   - Customizable trigger timing

3. **AI Chat Widget**
   - Context-aware responses using site knowledge base
   - Embedded chat interface on client sites
   - Session tracking and analytics

4. **Admin Dashboard**
   - Site management
   - Crawl status monitoring
   - Analytics viewing
   - API key management

## User Flows

### SaaS Owner Flow
1. Register account with email/password
2. Add site URL (optional: site name)
3. System crawls site automatically (background job, 1-2 minutes)
4. Owner receives embed script with unique API key
5. Owner adds script to their website
6. (Optional) Configure trigger delay settings
7. (Optional) Add custom knowledge text

### End User Flow (New Visitor)
1. Lands on client's website
2. After N seconds of inactivity → walkthrough activates
   - 5-step interactive tour with tooltips
   - Highlights key UI elements
   - Can skip/close at any time
3. Chat widget icon always visible in corner
4. Click chat → ask questions about the product
5. Receives AI-generated answers from knowledge base

## Technical Architecture

### Monorepo Structure (Turborepo)
```
/
├── packages/
│   ├── backend/          # Node.js + TypeScript API
│   ├── admin-app/        # React admin dashboard
│   ├── widget/           # TypeScript embedded widget
│   └── shared/           # Shared types and utilities
├── turbo.json
└── package.json
```

### Tech Stack

**Backend:**
- Runtime: Node.js + TypeScript
- Framework: Express
- Queue: BullMQ + Redis
- Database: PostgreSQL
- Vector DB: Pinecone (free tier: 1M vectors)
- Crawling: Puppeteer
- AI Services:
  - OpenAI (text-embedding-3-small for embeddings)
  - Claude API (chat responses)

**Frontend Admin:**
- React + TypeScript
- Build tool: Vite
- Styling: TailwindCSS
- State management: Redux Toolkit + RTK query

**Widget Script:**
- Pure TypeScript (compiled to vanilla JS)
- Zero dependencies
- Heavy minification for performance

**Infrastructure:**
- Redis (BullMQ jobs)
- PostgreSQL (relational data)
- Pinecone (vector embeddings)

## Database Schema

### PostgreSQL Tables

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Site {
  id: string;
  userId: string;
  url: string;
  domain: string;
  name?: string;
  status: 'pending' | 'crawling' | 'active' | 'error';
  triggerDelaySeconds: number; // default: 5
  createdAt: Date;
  updatedAt: Date;
}

interface ApiKey {
  id: string;
  siteId: string;
  key: string;
  isActive: boolean;
  createdAt: Date;
  lastRegeneratedAt?: Date;
}

interface WalkthroughStep {
  id: string;
  siteId: string;
  version: number;
  stepOrder: number; // 1-5
  targetSelectors: string[]; // fallback selectors array
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  isActive: boolean;
  createdAt: Date;
}

interface KnowledgeBase {
  id: string;
  siteId: string;
  pageUrl: string;
  content: string;
  vectorId: string; // Pinecone vector ID
  createdAt: Date;
  updatedAt: Date;
}

interface CustomKnowledge {
  id: string;
  siteId: string;
  title: string;
  content: string;
  vectorId: string;
  createdAt: Date;
}

interface ChatMessage {
  id: string;
  siteId: string;
  sessionId: string; // anonymous UUID
  message: string; // user question
  response: string; // AI answer
  responseTimeMs: number;
  createdAt: Date;
}

interface Analytics {
  id: string;
  siteId: string;
  eventType: 'walkthrough_started' | 'walkthrough_completed' | 'walkthrough_skipped' | 'chat_message';
  sessionId: string;
  metadata: Record<string, any>; // JSONB
  createdAt: Date;
}
```

### Pinecone Vector Storage

```typescript
// Vector structure
{
  id: `${siteId}_${pageUrl}_${chunkIndex}`,
  values: number[], // embedding vector (~1536 dimensions)
  metadata: {
    siteId: string,
    pageUrl: string,
    content: string,
    heading?: string,
    source: 'crawled' | 'custom'
  }
}
```

## Clean Architecture Layers

### 1. Domain Layer (Entities & Interfaces)
- Entity definitions (User, Site, etc.)
- Repository interfaces
- Service interfaces

### 2. Application Layer (Services)

```typescript
interface IAuthService {
  register(email: string, password: string): Promise<{ user: User; token: string }>;
  login(email: string, password: string): Promise<{ user: User; token: string }>;
  validateToken(token: string): Promise<User>;
}

interface ISiteService {
  createSite(userId: string, url: string, name?: string): Promise<Site>;
  getSitesByUserId(userId: string): Promise<Site[]>;
  updateTriggerSettings(siteId: string, delaySeconds: number): Promise<Site>;
  deleteSite(siteId: string): Promise<void>;
  triggerRecrawl(siteId: string): Promise<void>;
}

interface IApiKeyService {
  generateKey(siteId: string): Promise<ApiKey>;
  regenerateKey(siteId: string): Promise<ApiKey>;
  validateKey(key: string, domain: string): Promise<{ valid: boolean; siteId?: string }>;
}

interface ICrawlingService {
  startCrawl(siteId: string): Promise<void>;
  getCrawlStatus(siteId: string): Promise<CrawlStatus>;
}

interface IKnowledgeBaseService {
  addCustomKnowledge(siteId: string, title: string, content: string): Promise<void>;
  search(siteId: string, query: string, topK?: number): Promise<SearchResult[]>;
}

interface IWalkthroughService {
  generateSteps(siteId: string, crawledData: CrawledData): Promise<WalkthroughStep[]>;
  getSteps(siteId: string, version?: number): Promise<WalkthroughStep[]>;
  createNewVersion(siteId: string): Promise<number>;
}

interface IChatService {
  handleQuery(apiKey: string, sessionId: string, message: string): Promise<{
    response: string;
    responseTime: number;
  }>;
}

interface IAnalyticsService {
  trackEvent(
    siteId: string,
    eventType: Analytics['eventType'],
    sessionId: string,
    metadata?: Record<string, any>
  ): Promise<void>;
  getMetrics(siteId: string, dateRange: DateRange): Promise<SiteMetrics>;
}
```

### 3. Data Access Layer (Repositories)

```typescript
interface IUserRepository {
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<User>;
}

interface ISiteRepository {
  create(site: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>): Promise<Site>;
  findById(id: string): Promise<Site | null>;
  findByUserId(userId: string): Promise<Site[]>;
  findByDomain(domain: string): Promise<Site | null>;
  updateStatus(id: string, status: Site['status']): Promise<Site>;
  update(id: string, data: Partial<Site>): Promise<Site>;
}

interface IApiKeyRepository {
  create(apiKey: Omit<ApiKey, 'id' | 'createdAt'>): Promise<ApiKey>;
  findByKey(key: string): Promise<ApiKey | null>;
  findBySiteId(siteId: string): Promise<ApiKey | null>;
  regenerate(siteId: string, newKey: string): Promise<ApiKey>;
  deactivate(id: string): Promise<void>;
}

interface IWalkthroughRepository {
  createBatch(steps: Omit<WalkthroughStep, 'id' | 'createdAt'>[]): Promise<WalkthroughStep[]>;
  findBySiteId(siteId: string, version?: number): Promise<WalkthroughStep[]>;
  deactivateVersion(siteId: string, version: number): Promise<void>;
}

interface IKnowledgeBaseRepository {
  create(kb: Omit<KnowledgeBase, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeBase>;
  findBySiteId(siteId: string): Promise<KnowledgeBase[]>;
  deleteBySiteId(siteId: string): Promise<void>;
}

interface ICustomKnowledgeRepository {
  create(knowledge: Omit<CustomKnowledge, 'id' | 'createdAt'>): Promise<CustomKnowledge>;
  findBySiteId(siteId: string): Promise<CustomKnowledge[]>;
}

interface IChatMessageRepository {
  create(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>;
  findBySiteId(siteId: string, limit?: number): Promise<ChatMessage[]>;
}

interface IAnalyticsRepository {
  create(event: Omit<Analytics, 'id' | 'createdAt'>): Promise<Analytics>;
  findBySiteId(siteId: string, dateRange: DateRange): Promise<Analytics[]>;
}
```

### 4. Infrastructure Layer
- PostgreSQL connection
- Pinecone client
- OpenAI/Claude API clients
- BullMQ queue configuration
- Redis connection

## API Endpoints

### Admin API (Authentication Required)

**Auth Routes:**
```
POST   /api/auth/register
POST   /api/auth/login
```

**Site Management:**
```
GET    /api/sites                    # Get all sites for logged-in user
POST   /api/sites                    # Create new site (triggers crawl)
GET    /api/sites/:id                # Get site details
PUT    /api/sites/:id                # Update site settings
DELETE /api/sites/:id                # Delete site
POST   /api/sites/:id/recrawl        # Trigger manual recrawl
GET    /api/sites/:id/crawl-status   # Poll crawl progress
```

**API Key Management:**
```
POST   /api/sites/:id/api-key/regenerate
GET    /api/sites/:id/api-key
```

**Custom Knowledge:**
```
POST   /api/sites/:id/knowledge      # Add custom text knowledge
```

**Analytics:**
```
GET    /api/sites/:id/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
```

### Widget API (Public, API Key Authentication)

```
GET    /api/widget/walkthrough?key=xxx
       Response: { steps: WalkthroughStep[] }

POST   /api/widget/chat
       Body: { key: string, sessionId: string, message: string }
       Response: { response: string, responseTime: number }

POST   /api/widget/analytics/track
       Body: { key: string, eventType: string, sessionId: string, metadata?: object }
       Response: { success: boolean }
```

## Crawling Process

### Architecture Flow

```
User creates Site
    ↓
Backend creates Site record (status: 'pending')
    ↓
Adds CrawlJob to BullMQ
    ↓
Background Worker processes job:
    1. Set status: 'crawling'
    2. Puppeteer crawls site (depth: 2 levels, max 50 pages)
    3. Extract content from each page
    4. Chunk content (~500-1000 tokens per chunk)
    5. Generate embeddings (OpenAI text-embedding-3-small)
    6. Upsert vectors to Pinecone
    7. Analyze site structure with AI
    8. Generate 5 walkthrough steps
    9. Save steps to PostgreSQL
    10. Set status: 'active'
```

### Crawling Details

**Puppeteer Configuration:**
- Headless mode
- JavaScript rendering enabled
- Crawl depth: 2 levels from homepage
- Max pages: 50 (for MVP)
- Timeout per page: 30 seconds
- Only same-domain links

**Content Extraction:**
- Remove: nav, footer, scripts, styles, ads
- Extract: main content, headings, buttons, links
- Text normalization and cleaning

**Chunking Strategy:**
- Target chunk size: 500-1000 tokens
- Preserve context (include page URL, parent heading)
- Overlap between chunks: 50 tokens

**Embedding Generation:**
```typescript
const embedding = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: chunkText
});

await pinecone.upsert({
  id: `${siteId}_${pageUrl}_${chunkIndex}`,
  values: embedding.data[0].embedding,
  metadata: {
    siteId,
    pageUrl,
    content: chunkText,
    heading,
    source: 'crawled'
  }
});
```

**Estimated Times:**
- Small site (15 pages): 1-2 minutes
- Large site (50 pages): 3-5 minutes

### Walkthrough Generation

AI analyzes crawled site structure to identify:
1. Primary CTA buttons (signup, get started, etc.)
2. Key navigation elements
3. Important features/sections
4. Onboarding-relevant UI elements

Generates 5 steps with:
- Multiple fallback CSS selectors per element
- Position for tooltip (top/bottom/left/right)
- Title and description text
- Logical flow order

## Widget Implementation

### Embed Script Structure

```typescript
// Client embeds:
<script src="https://cdn.yourapp.com/widget.js" data-api-key="xxx"></script>

// Widget responsibilities:
1. Validate API key with backend
2. Check if user is new (localStorage)
3. After trigger delay → show walkthrough
4. Render chat icon
5. Handle user interactions
6. Track analytics events
```

### Widget Features

**Walkthrough UI:**
- Overlay with dimmed background
- Highlighted element (z-index manipulation)
- Positioned tooltip bubble
- Step counter (1/5, 2/5, etc.)
- Next/Skip/Close buttons
- Smooth transitions

**Chat Interface:**
- Floating icon (bottom-right corner)
- Expandable chat window
- Message history (session-based)
- Typing indicators
- Auto-scroll

**Trigger Logic:**
```typescript
// Activate walkthrough if:
- New user (no localStorage flag)
- User inactive for N seconds (configurable)
- Not already shown in this session

// Chat icon:
- Always visible
- Badge notification on first visit
```

### Widget API Communication

```typescript
// Rate limiting: Client-side (1 request per 2 seconds)
// Authentication: API key in headers
// Session management: UUID in localStorage
```

## Security & Validation

### API Key Validation
- Verify key exists and is active
- Match request domain against site.domain
- Block if domain mismatch (prevents unauthorized embedding)

### Rate Limiting
- Middleware on widget endpoints
- 60 requests per minute per API key
- Redis-based counter

### Input Validation
- URL validation on site creation
- Domain extraction and normalization
- XSS prevention on custom knowledge input
- SQL injection prevention (parameterized queries)

## Analytics & Metrics

### Tracked Events
1. `walkthrough_started` - User sees first step
2. `walkthrough_completed` - User finishes all 5 steps
3. `walkthrough_skipped` - User closes walkthrough early
4. `chat_message` - User sends chat message

### Metrics Dashboard
- Walkthrough completion rate (%)
- Average steps completed before skip
- Chat engagement (messages per session)
- Average response time
- Daily active sessions

## Development Phases

### Phase 1: Core Infrastructure (Week 1-2)
- Monorepo setup with Turborepo
- PostgreSQL schema + migrations
- Basic Express API structure
- Authentication (register/login)
- Site CRUD operations

### Phase 2: Crawling System (Week 2-3)
- Puppeteer crawler implementation
- BullMQ job queue setup
- Content extraction logic
- OpenAI embeddings integration
- Pinecone vector storage
- Crawl status polling API

### Phase 3: Walkthrough System (Week 3-4)
- AI walkthrough generation
- Widget script development
- Walkthrough UI components
- Element targeting logic
- API endpoints for widget

### Phase 4: Chat System (Week 4-5)
- Chat widget UI
- Knowledge base search (Pinecone)
- Claude API integration
- Response generation
- Message persistence

### Phase 5: Admin Dashboard (Week 5-6)
- React app setup
- Site management UI
- Crawl status monitoring
- Analytics dashboard
- API key management

### Phase 6: Polish & Testing (Week 6)
- End-to-end testing
- Error handling
- Performance optimization
- Documentation
- Deployment setup

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Vector Database
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=onboarding-kb

# Authentication
JWT_SECRET=...
JWT_EXPIRES_IN=7d

# Application
NODE_ENV=development|production
PORT=3000
WIDGET_CDN_URL=https://cdn.yourapp.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
```

## Deployment Considerations

### Backend + Admin
- Railway / Render / Fly.io
- Docker container
- Auto-scaling based on queue size

### Widget Script
- Cloudflare CDN / AWS CloudFront
- Versioned releases (widget-v1.0.0.js)
- Cache headers (long TTL)

### Databases
- PostgreSQL: Managed service (Supabase, Railway, Neon)
- Redis: Redis Cloud / Upstash
- Pinecone: Managed (free tier)

## Success Metrics (Post-Launch)

- Reduce client churn rate by 15-20%
- Average walkthrough completion rate >40%
- Chat response accuracy >80%
- Widget load time <500ms
- API response time <200ms

## Future Enhancements (Post-MVP)

1. Document upload support (.pdf, .docx)
2. Custom walkthrough editing (drag & drop builder)
3. Multiple walkthrough versions per site
4. A/B testing walkthroughs
5. Webhooks for crawl completion
6. Advanced analytics (heatmaps, session replay)
7. Multi-language support
8. Theming/customization for widget
9. Integration with analytics tools (Mixpanel, Amplitude)
10. Video walkthroughs

## Notes for Code Agent

### Priority Order
1. Start with backend infrastructure and database
2. Implement crawling system first (critical path)
3. Build widget script early for testing
4. Admin dashboard can be built in parallel
5. Analytics is lowest priority

### Code Quality Requirements
- TypeScript strict mode enabled
- ESLint + Prettier configured
- Unit tests for services (Jest)
- Integration tests for API endpoints
- Error handling and logging throughout

### Development Best Practices
- Use dependency injection for services
- Keep business logic in services, not controllers
- Validate all inputs at API boundary
- Use transactions for multi-step database operations
- Implement proper error types and handling
- Add JSDoc comments for public interfaces

### Testing Approach
- Mock external services (OpenAI, Pinecone, Claude)
- Use test database for integration tests
- E2E tests with Playwright for widget
- Load testing for crawling system
