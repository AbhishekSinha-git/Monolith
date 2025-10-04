# Future Finance AI PWA - Backend Architecture & Implementation Guide

## 🎯 Project Overview

This project implements a secure, AI-powered personal finance assistant that integrates with **Fi Money's MCP Server** (the world's first consumer-facing personal finance MCP) and **Google Gemini AI** to provide deeply personalized financial insights.

### Core Problem Solved
- **Data Fragmentation**: Financial data scattered across 18+ sources (banks, mutual funds, stocks, EPF, etc.)
- **AI Limitations**: Generic AI can't provide meaningful insights without structured, real financial data
- **Privacy & Control**: Users need complete ownership of their insights and data

### Solution Architecture
- **Frontend**: React PWA with OAuth authentication
- **Backend**: Node.js/Express with secure session management
- **Data Layer**: PostgreSQL + Redis for caching
- **AI Integration**: Google Gemini via Vertex AI
- **Financial Data**: Fi MCP Server for data consolidation and normalization

---

## 🏗️ Backend Architecture

### 1. Technology Stack

#### Core Framework
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with Express-Session
- **Authentication**: Passport.js + Google OAuth 2.0
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache**: Redis 7+ for session storage and API caching
- **Queue**: Bull/BullMQ for background jobs (data sync, AI processing)

#### AI & Financial Integration
- **Google AI**: Gemini Pro via Vertex AI SDK
- **MCP Protocol**: Fi Money's MCP Server for financial data
- **Data Processing**: Node-cron for scheduled syncs, Joi for validation

#### Security & Infrastructure
- **Security**: Helmet.js, CORS, Rate limiting (express-rate-limit)
- **Environment**: Docker + Docker Compose for development
- **Deployment**: AWS ECS/Fargate or Google Cloud Run
- **Monitoring**: Winston logging, Prometheus metrics

### 2. System Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend PWA  │    │   Backend API   │    │   Fi MCP Server │
│   (React/TS)    │◄──►│  (Node/Express) │◄──►│  (External)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   + Redis       │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Google Gemini  │
                       │  (Vertex AI)    │
                       └─────────────────┘
```

---

## 🗄️ Database Design

### 1. Core Tables

#### Users & Authentication
```sql
-- Users table (extends OAuth profile)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User sessions (Redis-based, but backup in DB)
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- OAuth tokens (encrypted storage)
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL, -- encrypted
  refresh_token TEXT NOT NULL, -- encrypted
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Financial Data Sources & Connections
```sql
-- Financial institutions/providers
CREATE TABLE financial_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL, -- "HDFC Bank", "SBI", "Fi MCP"
  type VARCHAR(100) NOT NULL, -- "bank", "investment", "insurance", "mcp"
  logo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User's connected accounts
CREATE TABLE user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES financial_providers(id),
  external_account_id VARCHAR(255), -- ID from provider
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(100) NOT NULL, -- "savings", "current", "credit_card"
  account_number_masked VARCHAR(50),
  status VARCHAR(50) DEFAULT 'connected', -- "connected", "error", "syncing"
  last_sync_at TIMESTAMP,
  sync_frequency_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Data sync history
CREATE TABLE data_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_account_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL, -- "full", "incremental", "manual"
  status VARCHAR(50) NOT NULL, -- "success", "failed", "partial"
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INTEGER
);
```

#### Financial Data (Fi MCP Integration)
```sql
-- Assets (bank balances, investments, etc.)
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_account_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
  asset_type VARCHAR(100) NOT NULL, -- "bank_account", "investment", "epf", "fd"
  name VARCHAR(255) NOT NULL,
  balance DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  interest_rate DECIMAL(5,2),
  maturity_date DATE,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Liabilities (loans, credit cards)
CREATE TABLE liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_account_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
  liability_type VARCHAR(100) NOT NULL, -- "personal_loan", "home_loan", "credit_card"
  name VARCHAR(255) NOT NULL,
  outstanding_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  emi_amount DECIMAL(10,2),
  due_date DATE,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Credit scores
CREATE TABLE credit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(100) NOT NULL, -- "CIBIL", "Experian", "Equifax"
  score INTEGER NOT NULL CHECK (score >= 300 AND score <= 900),
  band VARCHAR(20) NOT NULL, -- "poor", "fair", "good", "excellent"
  report_date DATE NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- EPF data
CREATE TABLE epf_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  uan_masked VARCHAR(20) NOT NULL,
  balance DECIMAL(15,2) NOT NULL,
  last_contribution_date DATE,
  employer_contribution DECIMAL(10,2),
  employee_contribution DECIMAL(10,2),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Net worth tracking
CREATE TABLE net_worth_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_assets DECIMAL(15,2) NOT NULL,
  total_liabilities DECIMAL(15,2) NOT NULL,
  net_worth DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### AI Insights & Conversations
```sql
-- AI-generated insights
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL, -- "spending", "budget", "investments", "savings"
  impact VARCHAR(255), -- "$540/year", "+$200/month"
  severity VARCHAR(20) DEFAULT 'medium', -- "low", "medium", "high"
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source_data JSONB, -- references to underlying financial data
  gemini_model_version VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP -- insights can expire
);

-- Chat conversations
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_user_message BOOLEAN NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- "text", "chart", "insight"
  metadata JSONB, -- for charts, insights, actions
  created_at TIMESTAMP DEFAULT NOW()
);

-- User actions on insights
CREATE TABLE insight_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID REFERENCES ai_insights(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL, -- "dismiss", "implement", "snooze", "export"
  action_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Data Privacy & Consent
```sql
-- Data access consents
CREATE TABLE data_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scope VARCHAR(100) NOT NULL, -- "assets", "liabilities", "credit_score", "epf"
  status VARCHAR(20) DEFAULT 'granted', -- "granted", "revoked", "pending"
  granted_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,
  expires_at TIMESTAMP,
  purpose TEXT NOT NULL -- "AI insights", "Portfolio analysis"
);

-- Data export history
CREATE TABLE data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  export_type VARCHAR(100) NOT NULL, -- "insights", "financial_data", "full_export"
  file_url TEXT,
  file_size_bytes BIGINT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Database Indexes & Performance

```sql
-- Performance indexes
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_accounts_user_id ON user_accounts(user_id);
CREATE INDEX idx_user_accounts_provider_id ON user_accounts(provider_id);
CREATE INDEX idx_assets_user_account_id ON assets(user_account_id);
CREATE INDEX idx_liabilities_user_account_id ON liabilities(user_account_id);
CREATE INDEX idx_net_worth_history_user_date ON net_worth_history(user_id, date);
CREATE INDEX idx_ai_insights_user_category ON ai_insights(user_id, category);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_data_consents_user_scope ON data_consents(user_id, scope);

-- JSONB indexes for metadata
CREATE INDEX idx_assets_metadata ON assets USING GIN (metadata);
CREATE INDEX idx_insights_source_data ON ai_insights USING GIN (source_data);
```

---

## 🔐 Authentication & Security

### 1. OAuth Flow with Google

```typescript
// OAuth flow implementation
interface OAuthFlow {
  // 1. User clicks "Continue with Google"
  beginOAuth: (redirectUri: string) => Promise<{ authorizationUrl: string }>;
  
  // 2. Google redirects with auth code
  handleCallback: (code: string, state: string) => Promise<{ user: User; sessionToken: string }>;
  
  // 3. Refresh tokens when expired
  refreshTokens: (refreshToken: string) => Promise<{ accessToken: string; refreshToken: string }>;
}
```

### 2. Session Management

```typescript
// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'sess:'
  })
};
```

### 3. Security Middleware

```typescript
// Security stack
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FI_MCP_URL, process.env.GEMINI_API_URL]
    }
  }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
}));
```

---

## 🔗 Fi MCP Integration

### 1. MCP Server Connection

```typescript
// Fi MCP client configuration
interface FiMCPConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
}

class FiMCPClient {
  private config: FiMCPConfig;
  
  constructor(config: FiMCPConfig) {
    this.config = config;
  }
  
  // Connect user's financial accounts
  async connectAccounts(userId: string, providerIds: string[]): Promise<ConnectionResult[]> {
    // Implementation for connecting to banks, investment platforms, etc.
  }
  
  // Fetch financial data
  async fetchFinancialData(userId: string, dataTypes: string[]): Promise<FinancialData> {
    // Fetch assets, liabilities, credit scores, EPF data
  }
  
  // Sync data periodically
  async syncData(userId: string, accountIds: string[]): Promise<SyncResult[]> {
    // Background sync of financial data
  }
}
```

### 2. Data Synchronization Strategy

```typescript
// Sync strategy implementation
class DataSyncManager {
  // Real-time sync for critical data
  async syncCriticalData(userId: string): Promise<void> {
    const accounts = await this.getUserAccounts(userId);
    
    for (const account of accounts) {
      if (account.syncFrequencyHours <= 1) {
        await this.syncAccount(account);
      }
    }
  }
  
  // Batch sync for non-critical data
  async batchSyncData(): Promise<void> {
    const users = await this.getActiveUsers();
    
    for (const user of users) {
      await this.queueSyncJob(user.id, 'batch');
    }
  }
  
  // Handle sync failures and retries
  async handleSyncFailure(accountId: string, error: Error): Promise<void> {
    await this.updateAccountStatus(accountId, 'error');
    await this.scheduleRetry(accountId, error);
  }
}
```

---

## 🤖 AI Integration with Google Gemini

### 1. Gemini API Integration

```typescript
// Gemini client for financial insights
interface GeminiConfig {
  projectId: string;
  location: string;
  modelName: string;
  apiKey: string;
}

class GeminiClient {
  private config: GeminiConfig;
  private vertexAI: VertexAI;
  
  constructor(config: GeminiConfig) {
    this.config = config;
    this.vertexAI = new VertexAI({
      project: config.projectId,
      location: config.location
    });
  }
  
  // Generate financial insights
  async generateInsights(userId: string, context: FinancialContext): Promise<AIInsight[]> {
    const prompt = this.buildInsightPrompt(context);
    const response = await this.generateContent(prompt);
    
    return this.parseInsights(response);
  }
  
  // Chat with financial context
  async chat(userId: string, message: string, conversationHistory: ChatMessage[]): Promise<ChatResponse> {
    const context = await this.getUserFinancialContext(userId);
    const prompt = this.buildChatPrompt(message, conversationHistory, context);
    
    const response = await this.generateContent(prompt);
    return this.parseChatResponse(response);
  }
  
  // Financial scenario simulation
  async simulateScenario(userId: string, scenario: FinancialScenario): Promise<SimulationResult> {
    const context = await this.getUserFinancialContext(userId);
    const prompt = this.buildSimulationPrompt(scenario, context);
    
    const response = await this.generateContent(prompt);
    return this.parseSimulationResult(response);
  }
}
```

### 2. Prompt Engineering for Financial Insights

```typescript
// Prompt templates for different financial scenarios
const promptTemplates = {
  spendingAnalysis: `
    Analyze the user's spending patterns from the following data:
    - Monthly spending: ${monthlySpending}
    - Category breakdown: ${categoryBreakdown}
    - Budget vs actual: ${budgetComparison}
    
    Provide insights on:
    1. Spending optimization opportunities
    2. Budget recommendations
    3. Savings potential
    4. Risk areas
    
    Format response as structured insights with actionable recommendations.
  `,
  
  investmentAdvice: `
    Based on the user's investment portfolio:
    - Current investments: ${investments}
    - Risk profile: ${riskProfile}
    - Financial goals: ${goals}
    - Market conditions: ${marketContext}
    
    Provide:
    1. Portfolio analysis
    2. Rebalancing recommendations
    3. New investment opportunities
    4. Risk assessment
    
    Include specific action items and expected outcomes.
  `,
  
  debtOptimization: `
    Analyze the user's debt situation:
    - Outstanding loans: ${loans}
    - Credit card balances: ${creditCards}
    - Interest rates: ${interestRates}
    - Monthly payments: ${monthlyPayments}
    
    Recommend:
    1. Debt consolidation opportunities
    2. Payment prioritization
    3. Interest rate optimization
    4. Credit score improvement strategies
  `
};
```

---

## 📊 API Endpoints

### 1. Authentication Endpoints

```typescript
// Auth routes
router.post('/auth/google/begin', async (req, res) => {
  const { redirectUri } = req.body;
  const authorizationUrl = await oauthService.beginGoogleOAuth(redirectUri);
  res.json({ authorizationUrl });
});

router.get('/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;
  const { user, sessionToken } = await oauthService.handleCallback(code, state);
  
  // Set secure cookie
  res.cookie('sessionToken', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });
  
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?status=success`);
});

router.get('/auth/session', authMiddleware, async (req, res) => {
  const session = await sessionService.getSession(req.user.id);
  res.json(session);
});

router.post('/auth/logout', authMiddleware, async (req, res) => {
  await sessionService.destroySession(req.user.id);
  res.clearCookie('sessionToken');
  res.status(204).send();
});
```

### 2. Financial Data Endpoints

```typescript
// Financial data routes
router.get('/api/financial/overview', authMiddleware, async (req, res) => {
  const overview = await financialService.getOverview(req.user.id);
  res.json(overview);
});

router.get('/api/financial/assets', authMiddleware, async (req, res) => {
  const assets = await financialService.getAssets(req.user.id);
  res.json(assets);
});

router.get('/api/financial/liabilities', authMiddleware, async (req, res) => {
  const liabilities = await financialService.getLiabilities(req.user.id);
  res.json(liabilities);
});

router.get('/api/financial/net-worth', authMiddleware, async (req, res) => {
  const { period } = req.query;
  const netWorth = await financialService.getNetWorthHistory(req.user.id, period);
  res.json(netWorth);
});

router.post('/api/financial/sync', authMiddleware, async (req, res) => {
  const { accountIds } = req.body;
  const syncJob = await financialService.queueSync(req.user.id, accountIds);
  res.json({ jobId: syncJob.id, status: 'queued' });
});
```

### 3. AI Insights Endpoints

```typescript
// AI insights routes
router.get('/api/insights', authMiddleware, async (req, res) => {
  const { category, limit } = req.query;
  const insights = await insightService.getInsights(req.user.id, { category, limit });
  res.json(insights);
});

router.post('/api/insights/generate', authMiddleware, async (req, res) => {
  const { categories } = req.body;
  const insights = await insightService.generateInsights(req.user.id, categories);
  res.json(insights);
});

router.post('/api/chat', authMiddleware, async (req, res) => {
  const { message, conversationId } = req.body;
  const response = await chatService.processMessage(req.user.id, message, conversationId);
  res.json(response);
});

router.get('/api/chat/conversations', authMiddleware, async (req, res) => {
  const conversations = await chatService.getConversations(req.user.id);
  res.json(conversations);
});

router.post('/api/simulate', authMiddleware, async (req, res) => {
  const { scenario } = req.body;
  const result = await simulationService.simulateScenario(req.user.id, scenario);
  res.json(result);
});
```

### 4. Data Management Endpoints

```typescript
// Data management routes
router.get('/api/connections', authMiddleware, async (req, res) => {
  const connections = await connectionService.getConnections(req.user.id);
  res.json(connections);
});

router.post('/api/connections/connect', authMiddleware, async (req, res) => {
  const { providerId, credentials } = req.body;
  const connection = await connectionService.connectProvider(req.user.id, providerId, credentials);
  res.json(connection);
});

router.delete('/api/connections/:connectionId', authMiddleware, async (req, res) => {
  await connectionService.disconnectProvider(req.user.id, req.params.connectionId);
  res.status(204).send();
});

router.get('/api/consents', authMiddleware, async (req, res) => {
  const consents = await consentService.getConsents(req.user.id);
  res.json(consents);
});

router.post('/api/consents', authMiddleware, async (req, res) => {
  const { scopes, purpose } = req.body;
  const consent = await consentService.grantConsent(req.user.id, scopes, purpose);
  res.json(consent);
});

router.post('/api/export', authMiddleware, async (req, res) => {
  const { exportType, format } = req.body;
  const exportJob = await exportService.createExport(req.user.id, exportType, format);
  res.json({ jobId: exportJob.id, status: 'processing' });
});
```

---

## 🔄 Background Jobs & Scheduling

### 1. Job Queue Implementation

```typescript
// Bull queue configuration
const queues = {
  dataSync: new Queue('data-sync', {
    redis: redisConfig,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50
    }
  }),
  
  insightGeneration: new Queue('insight-generation', {
    redis: redisConfig,
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 25
    }
  }),
  
  dataExport: new Queue('data-export', {
    redis: redisConfig,
    defaultJobOptions: {
      removeOnComplete: 20,
      removeOnFail: 10
    }
  })
};

// Job processors
queues.dataSync.process(async (job) => {
  const { userId, accountIds } = job.data;
  return await financialService.syncAccounts(userId, accountIds);
});

queues.insightGeneration.process(async (job) => {
  const { userId, categories } = job.data;
  return await insightService.generateInsights(userId, categories);
});
```

### 2. Scheduled Tasks

```typescript
// Cron jobs for automated tasks
const scheduledJobs = {
  // Daily data sync at 2 AM
  dailySync: cron.schedule('0 2 * * *', async () => {
    const users = await userService.getActiveUsers();
    
    for (const user of users) {
      await queues.dataSync.add('daily-sync', { userId: user.id });
    }
  }),
  
  // Weekly insight generation
  weeklyInsights: cron.schedule('0 3 * * 1', async () => {
    const users = await userService.getActiveUsers();
    
    for (const user of users) {
      await queues.insightGeneration.add('weekly-insights', { 
        userId: user.id, 
        categories: ['spending', 'investments', 'savings'] 
      });
    }
  }),
  
  // Monthly net worth calculation
  monthlyNetWorth: cron.schedule('0 4 1 * *', async () => {
    const users = await userService.getActiveUsers();
    
    for (const user of users) {
      await netWorthService.calculateMonthlyNetWorth(user.id);
    }
  })
};
```

---

## 🚀 Deployment & Infrastructure

### 1. Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SESSION_SECRET=${SESSION_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - FI_MCP_URL=${FI_MCP_URL}
      - FI_MCP_API_KEY=${FI_MCP_API_KEY}
      - GEMINI_PROJECT_ID=${GEMINI_PROJECT_ID}
      - GEMINI_LOCATION=${GEMINI_LOCATION}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 2. Environment Variables

```bash
# .env.example
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/finance_ai
POSTGRES_DB=finance_ai
POSTGRES_USER=finance_user
POSTGRES_PASSWORD=secure_password

# Redis
REDIS_URL=redis://localhost:6379

# Session
SESSION_SECRET=your-super-secret-session-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Fi MCP
FI_MCP_URL=https://api.fi.money/mcp
FI_MCP_API_KEY=your-fi-mcp-api-key

# Google Gemini
GEMINI_PROJECT_ID=your-gcp-project-id
GEMINI_LOCATION=us-central1
GEMINI_API_KEY=your-gemini-api-key

# Frontend
FRONTEND_URL=http://localhost:3000

# Security
NODE_ENV=development
PORT=3000
```

---

## 📈 Monitoring & Observability

### 1. Logging Strategy

```typescript
// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Structured logging for different operations
logger.info('User authentication', {
  userId: user.id,
  method: 'google_oauth',
  success: true,
  timestamp: new Date().toISOString()
});

logger.error('Data sync failed', {
  userId: user.id,
  accountId: account.id,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
```

### 2. Metrics & Health Checks

```typescript
// Prometheus metrics
const metrics = {
  httpRequestsTotal: new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status']
  }),
  
  dataSyncDuration: new prometheus.Histogram({
    name: 'data_sync_duration_seconds',
    help: 'Duration of data sync operations',
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),
  
  aiInsightGeneration: new prometheus.Counter({
    name: 'ai_insights_generated_total',
    help: 'Total number of AI insights generated',
    labelNames: ['category', 'severity']
  })
};

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redis.ping();
    
    // Check external services
    const fiMCPHealth = await checkFiMCPHealth();
    const geminiHealth = await checkGeminiHealth();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        redis: 'healthy',
        fiMCP: fiMCPHealth ? 'healthy' : 'unhealthy',
        gemini: geminiHealth ? 'healthy' : 'unhealthy'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});
```

---

## 🔒 Security & Privacy

### 1. Data Encryption

```typescript
// Encryption service for sensitive data
class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  }
  
  encrypt(text: string): { encryptedData: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: cipher.getAuthTag().toString('hex')
    };
  }
  
  decrypt(encryptedData: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipher(this.algorithm, this.key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 2. Privacy Controls

```typescript
// Privacy service for data governance
class PrivacyService {
  // Data retention policies
  async enforceRetentionPolicies(): Promise<void> {
    const policies = [
      { table: 'data_sync_logs', retentionDays: 90 },
      { table: 'chat_messages', retentionDays: 365 },
      { table: 'ai_insights', retentionDays: 730 }
    ];
    
    for (const policy of policies) {
      await this.deleteExpiredData(policy.table, policy.retentionDays);
    }
  }
  
  // Data anonymization for analytics
  async anonymizeUserData(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `user_${userId.slice(0, 8)}@anonymized.com`,
        name: 'Anonymous User',
        avatar_url: null
      }
    });
  }
  
  // Consent management
  async revokeConsent(userId: string, scope: string): Promise<void> {
    await prisma.dataConsents.updateMany({
      where: { user_id: userId, scope },
      data: { status: 'revoked', revoked_at: new Date() }
    });
    
    // Trigger data deletion for revoked scope
    await this.deleteScopeData(userId, scope);
  }
}
```

---

## 🧪 Testing Strategy

### 1. Unit Tests

```typescript
// Example unit test for financial service
describe('FinancialService', () => {
  let financialService: FinancialService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  
  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    financialService = new FinancialService(mockPrisma);
  });
  
  describe('getNetWorth', () => {
    it('should calculate net worth correctly', async () => {
      const mockAssets = [
        { balance: 10000, currency: 'INR' },
        { balance: 5000, currency: 'INR' }
      ];
      
      const mockLiabilities = [
        { outstanding_amount: 2000, currency: 'INR' }
      ];
      
      mockPrisma.assets.findMany.mockResolvedValue(mockAssets);
      mockPrisma.liabilities.findMany.mockResolvedValue(mockLiabilities);
      
      const result = await financialService.getNetWorth('user-123');
      
      expect(result.netWorth).toBe(13000);
      expect(result.assets).toBe(15000);
      expect(result.liabilities).toBe(2000);
    });
  });
});
```

### 2. Integration Tests

```typescript
// Example integration test
describe('Financial API Integration', () => {
  let app: Express;
  let testUser: User;
  
  beforeAll(async () => {
    app = createTestApp();
    testUser = await createTestUser();
  });
  
  afterAll(async () => {
    await cleanupTestData();
  });
  
  it('should return financial overview for authenticated user', async () => {
    const response = await request(app)
      .get('/api/financial/overview')
      .set('Cookie', `sessionToken=${testUser.sessionToken}`)
      .expect(200);
    
    expect(response.body).toHaveProperty('netWorth');
    expect(response.body).toHaveProperty('assets');
    expect(response.body).toHaveProperty('liabilities');
  });
});
```

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose
- Google Cloud Platform account (for Gemini)
- Fi MCP API access

### 2. Installation

```bash
# Clone repository
git clone <repository-url>
cd future-finance-ai-pwa

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development environment
docker-compose up -d

# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Start development server
npm run dev
```

### 3. Development Workflow

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Run type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

---

## 🔮 Future Enhancements

### 1. Advanced AI Features
- **Multi-modal AI**: Support for voice, image, and document analysis
- **Predictive Analytics**: AI-powered financial forecasting and trend analysis
- **Personalized Recommendations**: Machine learning for user-specific financial advice

### 2. Enhanced Data Sources
- **Real-time Market Data**: Integration with stock exchanges and crypto platforms
- **Tax Optimization**: AI-powered tax planning and optimization
- **Insurance Analysis**: Comprehensive insurance portfolio management

### 3. Platform Extensions
- **Mobile Apps**: Native iOS and Android applications
- **API Marketplace**: Public APIs for third-party integrations
- **White-label Solutions**: Enterprise-grade financial AI platforms

---

## 📚 Additional Resources

- [Fi MCP Documentation](https://docs.fi.money/mcp)
- [Google Gemini API Guide](https://ai.google.dev/docs)
- [Prisma ORM Documentation](https://www.prisma.io/docs)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practices-security.html)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/tutorial-optimizer.html)

---

This backend architecture provides a robust, scalable foundation for the Future Finance AI PWA, ensuring security, performance, and maintainability while delivering powerful AI-driven financial insights to users.

