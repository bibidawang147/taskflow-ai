# Workflow Platform - Features Quick Reference

## Quick Summary

**Status:** Comprehensive platform with 40+ API endpoints, 21+ frontend pages, and 16 database models.

**Built With:** Express.js (Node.js) + React + PostgreSQL + Prisma

---

## API Endpoints by Category

### Authentication & User (6 endpoints)
```
POST   /api/auth/register           # User registration with validation
POST   /api/auth/login              # Login with JWT token
GET    /api/auth/profile            # Get authenticated user profile
GET    /api/credit/balance          # Get user's credit balance
POST   /api/credit/upgrade-tier     # Upgrade to Pro/Enterprise tier
GET    /api/credit/usage-stats      # Usage statistics over N days
```

### Workflows (17 endpoints)
```
GET    /api/workflows               # List public workflows (paginated, searchable)
GET    /api/workflows/:id           # Get workflow details + comments + ratings
POST   /api/workflows               # Create new workflow
PUT    /api/workflows/:id           # Update workflow
DELETE /api/workflows/:id           # Delete workflow
POST   /api/workflows/:id/execute   # Execute workflow
GET    /api/workflows/executions/:id # Get execution result
POST   /api/workflows/:id/clone     # Clone workflow to my account
POST   /api/workflows/:id/favorite  # Add to favorites
DELETE /api/workflows/:id/favorite  # Remove from favorites
GET    /api/workflows/templates     # Get workflow templates
GET    /api/workflows/article-examples      # Get example articles
GET    /api/workflows/article-examples/:id  # Get specific example
```

### Workflow Generation (4 endpoints)
```
POST   /api/workflows/generate/from-article      # Article → Workflow
POST   /api/workflows/generate/from-article-mock # Test mode (no API needed)
POST   /api/workflows/generate/from-content      # File/URL/Text → Workflow
POST   /api/workflows/generate/from-content-mock # Test mode (no API needed)
```

### User Dashboard (3 endpoints)
```
GET    /api/users/workflows        # Get my workflows
GET    /api/users/executions       # Get my execution history (paginated)
GET    /api/users/favorites        # Get my favorite workflows
```

### AI Chat (4 endpoints)
```
GET    /api/ai/models              # Get available AI models for my tier
POST   /api/ai/chat                # Chat with AI (request/response)
POST   /api/ai/chat/stream         # Chat with AI (streaming)
POST   /api/ai/test-connection     # Test AI provider connectivity
```

### Credit & Payment (3 endpoints)
```
GET    /api/credit/plans           # Get recharge packages
POST   /api/credit/recharge        # Create payment order
POST   /api/credit/payment-callback # Confirm payment (simulate)
```

### Workspace (4 endpoints)
```
GET    /api/workspace/layout       # Get my workspace layout
POST   /api/workspace/layout       # Save workspace layout
DELETE /api/workspace/layout       # Reset layout to default
GET    /api/workspace/export       # Export workspace data
```

### Web Crawling (4 endpoints)
```
GET    /api/crawler/check-environment    # Check if crawler is ready
POST   /api/crawler/xiaohongshu          # Crawl Xiaohongshu content
POST   /api/crawler/crawl-and-analyze    # Crawl + AI analyze → save workflows
POST   /api/crawler/analyze-note         # AI analyze single note
```

### Work Items (5 endpoints)
```
GET    /api/work-items              # Get all work items
GET    /api/work-items/daily-work   # Get frequently used items
POST   /api/work-items              # Create work item
POST   /api/work-items/track-usage  # Track usage (for recommendations)
POST   /api/work-items/batch        # Batch create work items
```

---

## Frontend Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/` | AIChatPage | Main AI chat & workflow interface |
| `/login` | LoginPage | User authentication |
| `/register` | RegisterPage | New user registration |
| `/home` | HomePage | Platform homepage |
| `/dashboard` | DashboardPage | User dashboard |
| `/workspace` | WorkspacePage | Workflow execution environment |
| `/storage` | StoragePage | Workflow library with drag-drop |
| `/explore` | ExplorePage | Discover public workflows |
| `/explore/theme/:id` | ExploreThemeDetailPage | Theme workflows |
| `/workflow/:id` | WorkflowDetailPage | Workflow details + execute |
| `/workflow-intro/:id` | WorkflowIntroPage | Workflow tutorial |
| `/workflow/new` | CreateWorkflowPage | Create new workflow |
| `/search` | SearchResultPage | Global search results |
| `/category/:cat` | CategoryPage | Category view |
| `/workflow-type/:type` | WorkflowTypePage | Type-filtered view |
| `/recharge` | RechargePage | Buy credits |
| `/membership` | MembershipPage | Tier upgrade info |
| `/usage-stats` | UsageStatsPage | Credit usage analytics |
| `/tool/:id` | AIToolIntroPage | AI tool tutorial |
| `/article-to-workflow` | ArticleWorkflowMVPPage | URL→Workflow converter |
| `/reverse-engineer` | ReverseEngineerPage | Content→Workflow converter |

---

## AI Models Available

### By Tier

**Free Tier:**
- GPT-4o Mini (OpenAI)
- Claude Haiku (Anthropic)
- Doubao (Bytedance)
- Qwen (Alibaba)
- ChatGLM (Zhipu)

**Pro Tier:** 
- All free models
- GPT-4o (OpenAI)
- Claude 3.5 Sonnet (Anthropic)
- Premium models with discount (15%)

**Enterprise Tier:**
- All models
- Highest discount (30%)
- 200K coins daily quota

---

## Credit System

| Tier | Daily Quota | Discount | Notes |
|------|-------------|----------|-------|
| Free | 10,000 coins | None | + 50K signup bonus |
| Pro | 50,000 coins | 15% off | ¥99/month |
| Enterprise | 200,000 coins | 30% off | ¥999/month |

### Recharge Plans
- ¥10 → 10,000 coins
- ¥50 → 55,000 coins (5,000 bonus)
- ¥100 → 120,000 coins (20,000 bonus)
- ¥500 → 650,000 coins (150,000 bonus)

---

## Database Models

1. **User** - Accounts & authentication
2. **Workflow** - Workflow definitions
3. **WorkflowNode** - Workflow node components
4. **WorkflowExecution** - Execution history
5. **ExecutionStep** - Step-level execution details
6. **Comment** - Workflow comments (with replies)
7. **Rating** - Workflow ratings (1-5 stars)
8. **Favorite** - User favorites
9. **WorkItem** - Daily task templates
10. **WorkItemUsage** - Usage tracking
11. **UserBalance** - Credit balance
12. **UsageLog** - AI usage tracking
13. **RechargeOrder** - Payment orders
14. **Tool** - Available tools
15. **ModelPricing** - AI model pricing
16. **WorkspaceLayout** - User workspace customization

---

## Key Features

### ✅ Fully Implemented

- User authentication & tier system
- Workflow CRUD & execution
- Multi-provider AI chat (streaming & non-streaming)
- Article/content → workflow conversion
- Workflow cloning & templates
- Credit/payment system (simulated)
- Web crawler (Xiaohongshu)
- Workspace layout persistence
- File upload & storage
- Usage analytics

### ⏳ Partially/Not Implemented

- Comment/rating CRUD endpoints (data models exist)
- Real payment integration (WeChat/Alipay/Stripe)
- Admin dashboard
- Notifications system
- Collaborative editing
- Share/invite links

---

## Authentication

- **Method:** JWT tokens in Authorization header
- **Format:** `Authorization: Bearer <token>`
- **Expiry:** Configured in environment
- **Login Flow:** POST /api/auth/login → get token → use in requests

## Security

- Password: min 8 chars, uppercase, lowercase, digits
- Rate limiting: 100 requests per 15 minutes
- CORS: Configured origins only
- HTTPS: Recommended for production
- Helmet.js for security headers

---

## Important File Paths

### Backend Routes
- `/backend/src/routes/auth.ts` - Authentication
- `/backend/src/routes/workflows.ts` - Workflows (1344 lines!)
- `/backend/src/routes/ai.ts` - AI chat
- `/backend/src/routes/credit.ts` - Payment/billing
- `/backend/src/routes/crawler.routes.ts` - Web crawling

### Backend Services
- `ai-proxy.service.ts` - Multi-provider AI
- `credit.service.ts` - Credit management
- `workflowExecutionService.ts` - Workflow execution
- `contentAnalysis.service.ts` - Content analysis
- `crawler.service.ts` - Web scraping

### Frontend Pages
- `/frontend/src/pages/AIChatPage.tsx` (137KB)
- `/frontend/src/pages/WorkspacePage.tsx` (283KB)
- `/frontend/src/pages/StoragePage.tsx` (107KB)

---

## Environment Variables Required

```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
ALIBABA_API_KEY=... (optional)
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret
```

---

## Getting Started

1. **Setup:** `npm install` in backend & frontend
2. **Database:** `npx prisma migrate dev`
3. **Backend:** `npm run dev` (port 3000)
4. **Frontend:** `npm run dev` (port 5173)
5. **Test:** POST /api/auth/register → login → explore

---

## Stats

- **Backend Routes:** 40+
- **Frontend Pages:** 21+
- **Database Models:** 16
- **Backend Services:** 12
- **Frontend Services:** 8
- **Lines of Code:** 1000+ (routes alone: 1344 lines in workflows.ts)

