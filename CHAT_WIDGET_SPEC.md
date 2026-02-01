# AI Chat Widget - Technical Specification

## Overview

This document specifies the implementation of an AI-powered chat widget that provides contextual answers to end users based on a crawled knowledge base. The widget embeds on client websites and uses vector search + LLM to answer questions.

---

## Business Requirements

### Core Functionality

1. **Embedded Chat Widget**
   - Floating chat icon on client's website
   - Expandable chat interface
   - Real-time AI responses based on site's knowledge base
   - Session persistence (localStorage)

2. **Answer Quality Flow**
   - Search knowledge base using vector similarity
   - Similarity threshold: **0.7** (configurable per site)
   - If score < 0.7 → "Unable to answer" → Prompt for email
   - If score >= 0.7 → Generate AI response using top 3-5 chunks

3. **Fallback Strategy**
   - **Default (MVP):** Only knowledge base answers
   - **Optional (admin toggle):** Allow general Claude knowledge with disclaimer
   - Unanswered questions saved for site owner review

4. **User Identification**
   - Anonymous by default (sessionId in localStorage)
   - Optional email collection:
     - When answer not found
     - Site owner can add custom identification via JS API: `widget.setUser({ email })`

5. **Rate Limiting & Abuse Protection**
   - **Per Session:** 15 messages per session (24h reset)
   - **Per IP:** 50 requests per hour (Redis-based)
   - Return 429 with clear message if exceeded

---

## Database Schema Updates

### New Tables

```typescript
// Unanswered Questions
interface UnansweredQuestion {
  id: string;
  siteId: string;
  sessionId: string;
  userEmail?: string; // collected when no answer found
  question: string;
  bestMatchScore: number; // highest similarity score found
  timestamp: Date;
  status: 'new' | 'contacted' | 'resolved';
  contactedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

// Chat Ratings
interface ChatRating {
  id: string;
  chatMessageId: string;
  siteId: string;
  sessionId: string;
  rating: 'positive' | 'negative'; // 👍 or 👎
  feedback?: string; // optional text feedback
  createdAt: Date;
}

// Rate Limit Tracking (Redis)
interface RateLimitKey {
  key: `session:${sessionId}` | `ip:${ipAddress}`;
  count: number;
  expiresAt: number; // Unix timestamp
}

// Widget Sessions (for analytics)
interface WidgetSession {
  id: string; // sessionId (UUID)
  siteId: string;
  ipAddress: string; // hashed for privacy
  userEmail?: string;
  messagesCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
}
```

### Schema Migrations

```sql
-- Unanswered Questions
CREATE TABLE unanswered_questions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  user_email TEXT,
  question TEXT NOT NULL,
  best_match_score DECIMAL(3,2) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'resolved')),
  contacted_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_unanswered_site_status ON unanswered_questions(site_id, status);
CREATE INDEX idx_unanswered_created ON unanswered_questions(created_at DESC);

-- Chat Ratings
CREATE TABLE chat_ratings (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  feedback TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ratings_site ON chat_ratings(site_id);
CREATE INDEX idx_ratings_message ON chat_ratings(chat_message_id);

-- Widget Sessions
CREATE TABLE widget_sessions (
  id TEXT PRIMARY KEY, -- sessionId from client
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  ip_address_hash TEXT NOT NULL,
  user_email TEXT,
  messages_count INTEGER NOT NULL DEFAULT 0,
  first_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_site ON widget_sessions(site_id);
CREATE INDEX idx_sessions_last_seen ON widget_sessions(last_seen_at DESC);
```

### Update Existing Tables

```sql
-- Add config to Site model
ALTER TABLE sites ADD COLUMN similarity_threshold DECIMAL(3,2) DEFAULT 0.70;
ALTER TABLE sites ADD COLUMN allow_general_knowledge BOOLEAN DEFAULT FALSE;
ALTER TABLE sites ADD COLUMN max_messages_per_session INTEGER DEFAULT 15;
```

---

## API Endpoints

### Widget Public API (No Auth, API Key Required)

All endpoints require `X-API-Key` header validation.

#### 1. POST `/api/widget/chat`

**Request:**
```typescript
{
  key: string;           // API key
  sessionId: string;     // UUID from localStorage
  message: string;       // User question (max 2000 chars)
  userEmail?: string;    // Optional, if user provided
}
```

**Response (Success - Answer Found):**
```typescript
{
  response: string;
  responseTime: number;  // milliseconds
  messageId: string;     // for rating
  sources?: Array<{      // optional: show which pages were used
    pageUrl: string;
    title: string;
  }>;
}
```

**Response (No Answer Found):**
```typescript
{
  response: "I don't have enough information to answer this question. Would you like to leave your email so the team can help you?";
  responseTime: number;
  canProvideEmail: true;
  unansweredQuestionId: string;
}
```

**Response (Rate Limited):**
```typescript
// HTTP 429
{
  error: "Rate limit exceeded";
  retryAfter: number; // seconds
  limitType: "session" | "ip";
}
```

#### 2. POST `/api/widget/unanswered/email`

Save email for unanswered question.

**Request:**
```typescript
{
  key: string;
  questionId: string;
  email: string;
}
```

**Response:**
```typescript
{
  success: true;
  message: "Thank you! The team will reach out to you soon.";
}
```

#### 3. POST `/api/widget/rating`

Rate a chat response.

**Request:**
```typescript
{
  key: string;
  messageId: string;
  rating: "positive" | "negative";
  feedback?: string;
}
```

**Response:**
```typescript
{
  success: true;
}
```

#### 4. POST `/api/widget/analytics/track`

Track widget events (same as before).

---

### Admin API (Authenticated)

#### 1. GET `/api/sites/:id/chat-history`

Get chat history for a site.

**Query Params:**
- `page`: number (default: 1)
- `limit`: number (default: 50, max: 100)
- `sessionId?`: string (filter by session)
- `rated?`: boolean (filter rated/unrated)

**Response:**
```typescript
{
  messages: Array<{
    id: string;
    sessionId: string;
    userEmail?: string;
    message: string;
    response: string;
    responseTime: number;
    rating?: {
      rating: "positive" | "negative";
      feedback?: string;
    };
    createdAt: Date;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
```

#### 2. GET `/api/sites/:id/unanswered`

Get unanswered questions.

**Query Params:**
- `status?`: "new" | "contacted" | "resolved"
- `page`: number
- `limit`: number

**Response:**
```typescript
{
  questions: Array<{
    id: string;
    sessionId: string;
    userEmail?: string;
    question: string;
    bestMatchScore: number;
    timestamp: Date;
    status: string;
    contactedAt?: Date;
    resolvedAt?: Date;
  }>;
  pagination: { ... };
}
```

#### 3. PATCH `/api/sites/:id/unanswered/:questionId/status`

Update unanswered question status.

**Request:**
```typescript
{
  status: "contacted" | "resolved";
}
```

#### 4. GET `/api/sites/:id/chat-analytics`

Get chat analytics.

**Query Params:**
- `from`: ISO date
- `to`: ISO date

**Response:**
```typescript
{
  totalMessages: number;
  totalSessions: number;
  avgMessagesPerSession: number;
  answeredRate: number; // percentage
  positiveRatingRate: number; // percentage
  topQuestions: Array<{
    question: string;
    count: number;
  }>;
  unansweredByDay: Array<{
    date: string;
    count: number;
  }>;
}
```

#### 5. PATCH `/api/sites/:id/chat-settings`

Update chat widget settings.

**Request:**
```typescript
{
  similarityThreshold?: number; // 0.0-1.0
  allowGeneralKnowledge?: boolean;
  maxMessagesPerSession?: number;
}
```

---

## AI Integration

### Model Selection

**Primary Model:** `gpt-4o-mini`
- Cost: $0.15/$0.60 per 1M tokens (input/output)
- Fast response time (~1-2 seconds)
- Good quality for customer support use case

**Embeddings:** `text-embedding-3-small`
- Cost: $0.02 per 1M tokens
- Dimension: 1536
- Already used for crawling

### Knowledge Base Search Flow

```typescript
async function searchKnowledgeBase(
  siteId: string,
  question: string
): Promise<SearchResult> {
  // 1. Generate embedding for question
  const questionEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: question
  });

  // 2. Query Pinecone
  const results = await pinecone.query({
    vector: questionEmbedding.data[0].embedding,
    topK: 5,
    namespace: siteId,
    includeMetadata: true
  });

  // 3. Get similarity threshold from site settings
  const site = await getSiteById(siteId);
  const threshold = site.similarityThreshold || 0.7;

  // 4. Filter by threshold
  const relevantChunks = results.matches.filter(
    match => match.score >= threshold
  );

  if (relevantChunks.length === 0) {
    return {
      hasAnswer: false,
      bestScore: results.matches[0]?.score || 0
    };
  }

  // 5. Take top 3 chunks (balance context vs tokens)
  const topChunks = relevantChunks.slice(0, 3);

  return {
    hasAnswer: true,
    chunks: topChunks.map(c => ({
      content: c.metadata.content,
      pageUrl: c.metadata.pageUrl,
      score: c.score
    })),
    bestScore: topChunks[0].score
  };
}
```

### Response Generation

```typescript
async function generateResponse(
  question: string,
  chunks: KnowledgeChunk[],
  allowGeneralKnowledge: boolean
): Promise<string> {
  const systemPrompt = allowGeneralKnowledge
    ? `You are a helpful customer support assistant. Answer questions using the provided knowledge base context. If the context doesn't contain the answer but you have general knowledge that could help, you may use it but MUST prefix your response with: "⚠️ Based on general knowledge (not specific to this product): "`
    : `You are a helpful customer support assistant. Answer questions ONLY using the provided knowledge base context. If the context doesn't contain enough information, politely say you don't have that information and suggest the user contact support.`;

  const context = chunks
    .map((chunk, i) => `[Source ${i + 1} - ${chunk.pageUrl}]\n${chunk.content}`)
    .join('\n\n---\n\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` }
    ],
    temperature: 0.3, // Lower = more focused on context
    max_tokens: 500
  });

  return response.choices[0].message.content;
}
```

### Cost Estimation

**Per message:**
- Question embedding: ~100 tokens × $0.02/1M = $0.000002
- Context + prompt: ~1,500 tokens × $0.15/1M = $0.000225
- Response: ~300 tokens × $0.60/1M = $0.00018
- **Total: ~$0.0004 per message**

**Monthly costs (Starter plan example):**
- 1,000 messages/month × $0.0004 = **$0.40**
- Plan price: $29/month
- **Gross margin: 98.6%**

---

## Rate Limiting Implementation

### Service Interface

```typescript
interface IRateLimitService {
  checkSessionLimit(sessionId: string, siteId: string): Promise<RateLimitResult>;
  checkIpLimit(ipAddress: string): Promise<RateLimitResult>;
  incrementSession(sessionId: string, siteId: string): Promise<void>;
  incrementIp(ipAddress: string): Promise<void>;
  getRemainingQuota(sessionId: string, siteId: string): Promise<number>;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limitType: 'session' | 'ip';
}
```

### Redis Implementation

```typescript
class RedisRateLimitService implements IRateLimitService {
  async checkSessionLimit(sessionId: string, siteId: string): Promise<RateLimitResult> {
    const site = await getSiteById(siteId);
    const limit = site.maxMessagesPerSession;
    
    const key = `ratelimit:session:${sessionId}`;
    const count = await redis.get(key) || 0;
    
    if (count >= limit) {
      const ttl = await redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + ttl * 1000),
        limitType: 'session'
      };
    }
    
    return {
      allowed: true,
      remaining: limit - count,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      limitType: 'session'
    };
  }

  async incrementSession(sessionId: string, siteId: string): Promise<void> {
    const key = `ratelimit:session:${sessionId}`;
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, 24 * 60 * 60); // 24 hours
    }
  }

  // Similar implementation for IP-based limiting
  async checkIpLimit(ipAddress: string): Promise<RateLimitResult> {
    const limit = 50; // 50 requests per hour
    const key = `ratelimit:ip:${ipAddress}`;
    const count = await redis.get(key) || 0;
    
    if (count >= limit) {
      const ttl = await redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + ttl * 1000),
        limitType: 'ip'
      };
    }
    
    return {
      allowed: true,
      remaining: limit - count,
      resetAt: new Date(Date.now() + 60 * 60 * 1000),
      limitType: 'ip'
    };
  }

  async incrementIp(ipAddress: string): Promise<void> {
    const key = `ratelimit:ip:${ipAddress}`;
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, 60 * 60); // 1 hour
    }
  }
}
```

---

## Widget Implementation

### Client-Side Architecture

**Widget Bundle Structure:**
```
widget.js (minified, ~50KB)
├── Chat UI components
├── Session management
├── API client
├── Rate limit handling
└── Analytics tracking
```

### Initialization

```typescript
// Client embeds:
<script 
  src="https://cdn.yourapp.com/widget.js" 
  data-api-key="sk_xxx"
  data-position="bottom-right"
></script>

// Widget auto-initializes
(function() {
  const script = document.currentScript;
  const apiKey = script.getAttribute('data-api-key');
  
  // Generate or retrieve sessionId
  let sessionId = localStorage.getItem('onboarding_session_id');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('onboarding_session_id', sessionId);
  }
  
  // Initialize widget
  window.OnboardingWidget = new Widget({
    apiKey,
    sessionId,
    apiUrl: 'https://api.yourapp.com',
    position: script.getAttribute('data-position') || 'bottom-right'
  });
})();
```

### Widget API for Site Owners

```typescript
// Optional: Set user identification
window.OnboardingWidget.setUser({
  email: 'user@example.com',
  name: 'John Doe'
});

// Open widget programmatically
window.OnboardingWidget.open();

// Close widget
window.OnboardingWidget.close();

// Listen to events
window.OnboardingWidget.on('message-sent', (data) => {
  console.log('User asked:', data.message);
});

window.OnboardingWidget.on('rating-submitted', (data) => {
  console.log('User rated:', data.rating);
});
```

### Chat Interface States

1. **Idle State**
   - Floating icon (bottom-right)
   - Badge notification (configurable)

2. **Chat Open State**
   - Message list (scrollable)
   - Input field with send button
   - "Powered by AI Onboarding" footer

3. **Loading State**
   - Typing indicator animation
   - Disable input during response

4. **No Answer State**
   ```
   Message: "I don't have enough information about that. 
   Would you like to leave your email so our team can help?"
   
   [Email input field]
   [Submit button]
   ```

5. **Rate Limit State**
   ```
   "You've reached the message limit for this session. 
   Please try again in X minutes."
   ```

6. **Rating Prompt**
   ```
   After each response:
   "Was this helpful?"
   [👍 Helpful] [👎 Not helpful]
   
   If 👎 clicked:
   [Optional feedback textarea]
   [Submit feedback]
   ```

---

## Security Considerations

### API Key Validation

```typescript
async function validateApiKey(
  key: string, 
  requestDomain: string
): Promise<{ valid: boolean; siteId?: string }> {
  const apiKey = await apiKeyRepo.findByKey(key);
  
  if (!apiKey || !apiKey.isActive) {
    return { valid: false };
  }
  
  const site = await siteRepo.findById(apiKey.siteId);
  
  // Check domain match (prevent unauthorized embedding)
  const siteDomain = new URL(site.url).hostname;
  if (requestDomain !== siteDomain) {
    console.warn(`Domain mismatch: ${requestDomain} !== ${siteDomain}`);
    return { valid: false };
  }
  
  return { valid: true, siteId: site.id };
}
```

### Input Sanitization

- **Message length:** Max 2,000 characters
- **Email validation:** RFC 5322 compliant regex
- **HTML escaping:** All user inputs in admin dashboard
- **SQL injection:** Use parameterized queries (already done with Prisma)

### IP Handling

- Hash IP addresses before storing: `SHA256(IP + SITE_SECRET)`
- Store hashed version in `widget_sessions.ip_address_hash`
- Use raw IP only for rate limiting (Redis, ephemeral)

---

## Analytics & Reporting

### Metrics to Track

1. **Engagement Metrics**
   - Total chat sessions
   - Total messages sent
   - Avg messages per session
   - Session duration

2. **Quality Metrics**
   - Answer rate (% of questions answered)
   - Positive rating rate
   - Negative rating rate with reasons
   - Unanswered questions by category

3. **Performance Metrics**
   - Avg response time
   - API errors rate
   - Rate limit hits

### Dashboard Views for Site Owners

**Overview Tab:**
- Total sessions (30d)
- Total messages (30d)
- Answer rate (%)
- Positive ratings (%)
- Chart: Messages over time

**Chat History Tab:**
- Filterable list of all conversations
- Search by sessionId or user email
- Export as CSV

**Unanswered Questions Tab:**
- List of questions that couldn't be answered
- Grouped by similarity
- Status tracking (new/contacted/resolved)
- Email contact button

**Insights Tab:**
- Most asked questions
- Common topics (keyword extraction)
- Best/worst performing pages (by answer rate)
- Suggestions for content improvement

---

## Implementation Phases

### Phase 1: Backend Core (Week 1)
- [ ] Database migrations for new tables
- [ ] Repository implementations
- [ ] Rate limiting service
- [ ] Knowledge base search service
- [ ] Chat service with OpenAI integration
- [ ] Widget API endpoints

### Phase 2: Admin Dashboard (Week 2)
- [ ] Chat history UI
- [ ] Unanswered questions dashboard
- [ ] Analytics charts
- [ ] Chat settings configuration
- [ ] Email notification setup

### Phase 3: Widget (Week 2-3)
- [ ] Widget UI components
- [ ] Session management
- [ ] Chat flow implementation
- [ ] Rating system
- [ ] Email collection for unanswered
- [ ] Analytics tracking

### Phase 4: Testing & Polish (Week 3)
- [ ] E2E testing of chat flow
- [ ] Rate limiting verification
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation

---

## Testing Strategy

### Unit Tests

```typescript
describe('KnowledgeBaseSearchService', () => {
  it('should return no answer when similarity below threshold', async () => {
    const result = await service.search(siteId, 'random question');
    expect(result.hasAnswer).toBe(false);
    expect(result.bestScore).toBeLessThan(0.7);
  });

  it('should return chunks when similarity above threshold', async () => {
    const result = await service.search(siteId, 'how to sign up');
    expect(result.hasAnswer).toBe(true);
    expect(result.chunks.length).toBeGreaterThan(0);
  });
});

describe('RateLimitService', () => {
  it('should allow requests within limit', async () => {
    const result = await service.checkSessionLimit(sessionId, siteId);
    expect(result.allowed).toBe(true);
  });

  it('should block requests exceeding limit', async () => {
    // Send 15 requests
    for (let i = 0; i < 15; i++) {
      await service.incrementSession(sessionId, siteId);
    }
    
    const result = await service.checkSessionLimit(sessionId, siteId);
    expect(result.allowed).toBe(false);
  });
});
```

### Integration Tests

- Widget API endpoint responses
- OpenAI API mocking
- Pinecone query mocking
- Redis rate limiting

### E2E Tests (Playwright)

- User opens widget and asks question
- User receives answer and rates it
- User asks unanswerable question and provides email
- Rate limit triggers and displays message

---

## Monitoring & Observability

### Metrics to Monitor

1. **API Performance**
   - Request rate (requests/min)
   - Response time (p50, p95, p99)
   - Error rate by endpoint

2. **AI Performance**
   - OpenAI API latency
   - Token usage per request
   - Answer quality (via ratings)

3. **Business Metrics**
   - Cost per message (track against budget)
   - Revenue per message (plan price / messages)
   - Customer satisfaction (positive rating %)

### Error Tracking

- Log all API errors with context
- Alert on error rate > 1%
- Track OpenAI API failures separately

### Cost Tracking

```typescript
async function trackAiCost(
  siteId: string,
  tokensUsed: { input: number; output: number },
  model: string
) {
  const cost = calculateCost(tokensUsed, model);
  
  await metrics.increment('ai_cost_total', cost, {
    siteId,
    model
  });
  
  // Alert if daily costs exceed threshold
  const dailyCost = await metrics.get('ai_cost_total', { 
    timeRange: '24h' 
  });
  
  if (dailyCost > DAILY_COST_THRESHOLD) {
    await alerting.send({
      level: 'warning',
      message: `Daily AI costs exceeded threshold: $${dailyCost}`
    });
  }
}
```

---

## Environment Variables

```bash
# Existing
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-... # for backend crawling
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=onboarding-kb

# New for Chat Widget
WIDGET_CDN_URL=https://cdn.yourapp.com
OPENAI_CHAT_MODEL=gpt-4o-mini
SIMILARITY_THRESHOLD_DEFAULT=0.70
SESSION_RATE_LIMIT_DEFAULT=15
IP_RATE_LIMIT_DEFAULT=50
DAILY_COST_THRESHOLD=100 # Alert if daily costs > $100
```

---

## Success Criteria

### MVP Launch Checklist

- [ ] Widget loads on test site without errors
- [ ] Chat successfully answers questions from knowledge base
- [ ] Unanswered questions are saved and accessible in admin
- [ ] Email collection works for unanswered questions
- [ ] Rating system functional
- [ ] Rate limiting prevents abuse
- [ ] Admin dashboard shows chat history and analytics
- [ ] No security vulnerabilities in penetration test
- [ ] API response time < 3 seconds (p95)
- [ ] Widget bundle size < 100KB

### Success Metrics (3 months post-launch)

- 10+ paying customers
- 50,000+ chat messages processed
- Answer rate > 70%
- Positive rating rate > 60%
- API uptime > 99.5%
- Avg response time < 2 seconds

---

## Future Enhancements (Post-MVP)

1. **Multi-language Support**
   - Detect user language
   - Translate questions/answers
   - Crawl multi-language sites

2. **Advanced Analytics**
   - Conversation flow analysis
   - Topic clustering
   - Content gap identification
   - A/B testing different prompts

3. **Customization**
   - Widget theming (colors, fonts)
   - Custom prompts per site
   - Conditional logic ("if user asks about pricing, show CTA")

4. **Integrations**
   - CRM integration (Salesforce, HubSpot)
   - Support ticket creation (Zendesk, Intercom)
   - Email marketing (Send unanswered to email campaign)

5. **Advanced Features**
   - Voice input/output
   - Image/screenshot analysis
   - Proactive chat suggestions
   - Lead qualification scoring

---

## Notes for Code Agent

### Priority Order
1. Database schema (migrations first)
2. Backend services (rate limiting, search, chat)
3. Widget API endpoints
4. Admin API endpoints
5. Widget implementation
6. Admin dashboard updates

### Code Quality Requirements
- TypeScript strict mode
- Comprehensive error handling
- Input validation on all endpoints
- Rate limiting middleware
- Request logging with correlation IDs
- Unit tests for all services
- Integration tests for API endpoints

### Performance Considerations
- Cache similarity threshold per site (Redis, 5min TTL)
- Batch OpenAI requests where possible
- Use streaming for long responses (future)
- Index database queries properly
- Monitor Pinecone query performance

### Security Checklist
- Validate API key on every widget request
- Check domain match to prevent unauthorized embedding
- Sanitize all user inputs
- Hash IP addresses for storage
- Use HTTPS only for widget CDN
- Implement CSRF protection on admin endpoints
- Rate limit both session and IP

---

## Appendix A: Example Prompts

### System Prompt (Knowledge Base Only)

```
You are a helpful customer support assistant for [SITE_NAME]. 

Your role is to answer user questions ONLY using the provided knowledge base context below. 

Rules:
1. If the context contains the answer, provide a clear, concise response
2. If the context doesn't contain enough information, say: "I don't have enough information about that in my knowledge base. Would you like to leave your email so our team can help you?"
3. Never make up information or use general knowledge
4. Keep responses under 300 words
5. Be friendly and professional

Context:
[KNOWLEDGE_BASE_CHUNKS]

User Question:
[USER_QUESTION]
```

### System Prompt (With General Knowledge)

```
You are a helpful customer support assistant for [SITE_NAME].

Your role is to answer user questions using the provided knowledge base context. If the context doesn't contain the answer but you have relevant general knowledge, you may use it BUT you MUST prefix your response with:

"⚠️ Based on general knowledge (not specific to this product): "

Rules:
1. Always prioritize knowledge base context
2. Keep responses under 300 words
3. Be friendly and professional
4. If you use general knowledge, make it very clear

Context:
[KNOWLEDGE_BASE_CHUNKS]

User Question:
[USER_QUESTION]
```

---

## Appendix B: Widget HTML/CSS/JS Stub

### Minimal Widget Structure

```html
<!-- Widget Container -->
<div id="onboarding-widget" class="onboarding-widget-container">
  <!-- Floating Button -->
  <button class="onboarding-widget-button">
    <svg>...</svg> <!-- Chat icon -->
  </button>
  
  <!-- Chat Window (hidden by default) -->
  <div class="onboarding-widget-chat">
    <div class="onboarding-widget-header">
      <span>Chat with us</span>
      <button class="onboarding-widget-close">×</button>
    </div>
    
    <div class="onboarding-widget-messages">
      <!-- Messages rendered here -->
    </div>
    
    <div class="onboarding-widget-input">
      <input type="text" placeholder="Ask a question..." />
      <button>Send</button>
    </div>
    
    <div class="onboarding-widget-footer">
      Powered by AI Onboarding
    </div>
  </div>
</div>
```

### CSS Requirements

- Position: fixed bottom-right (configurable)
- Z-index: 9999 (don't interfere with site)
- Mobile responsive (full screen on mobile)
- Smooth animations (fade in/out, slide up)
- Accessible (keyboard navigation, ARIA labels)

---

This specification provides complete requirements for implementing the AI Chat Widget feature. All technical decisions are finalized and ready for development.
