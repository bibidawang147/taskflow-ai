An Open-Source AI Workflow Orchestration Platform
NexusFlow is a high-performance, visual AI workflow platform inspired by industry leaders like Coze and Dify. It empowers developers to build, manage, and execute complex AI multi-agent workflows through an intuitive, drag-and-drop canvas interface.

🛠️ Tech Stack
Frontend
Core: React 19 + TypeScript + Vite

Styling: Tailwind CSS

Navigation: React Router

Visualization: @xyflow/react (Modern Workflow Editor)

Networking: Axios

Icons: Lucide React

Backend
Runtime: Node.js + Express + TypeScript

ORM: Prisma

Database: PostgreSQL

Auth: JWT + bcryptjs (Secure Authentication)

Security: Helmet + CORS + Express-Validator

🏗️ Project Architecture
Plaintext
workflow-platform/
├── frontend/           # React + Vite Frontend
│   ├── src/
│   │   ├── components/  # Reusable UI & Workflow Canvas
│   │   ├── pages/       # View components
│   │   ├── services/    # API integration (Claude/OpenAI)
│   │   └── hooks/       # Custom React Hooks
├── backend/            # Node.js API Service
│   ├── src/
│   │   ├── controllers/ # Business Logic
│   │   ├── middleware/  # Auth & Validation
│   │   └── server.ts    # Entry point
│   └── prisma/         # Schema & Migrations
├── shared/             # Shared Types & Constants
└── docs/               # Technical Documentation
✨ Features
✅ Core Infrastructure
[x] Full-stack Foundation: Production-ready React 19 & Node.js environment.

[x] Database Schema: Optimized PostgreSQL schema via Prisma for high-concurrency workflow execution.

✅ Advanced Auth System
[x] Secure Access: JWT-based tokenization with encrypted password storage.

[x] State Management: Frontend auth persistence with protected routing.

✅ Visual Workflow Designer
[x] Canvas Engine: Powered by React Flow (@xyflow/react).

[x] Rich Node Types:

Input/Output: Seamless data entry and retrieval.

LLM Node: Integration-ready for Claude 4.6 and OpenAI.

Logic Tools: Custom tool-calling and conditional branching.

[x] Interaction: Drag-and-drop connectivity with real-time node configuration panels.

📈 Roadmap
Phase 2: Core Intelligence (In Progress)
[ ] Execution Engine: Real-time workflow parsing and execution.

[ ] Deep LLM Integration: First-class support for Claude 4.6 (Sonnet/Opus) with Prompt Caching.

[ ] Asset Management: File upload, vector storage, and RAG integration.

Phase 3: Ecosystem & Community
[ ] Workflow Marketplace: Sharing and discovery of high-performance templates.

[ ] Social Integration: Peer reviews, ratings, and collaborative editing.

🚀 Getting Started
Prerequisites
Node.js 18+

PostgreSQL 14+

Installation
Clone the Repo

Bash
git clone https://github.com/your-username/nexusflow.git
cd nexusflow
Setup Dependencies

Bash
# Install Frontend
cd frontend && npm install
# Install Backend
cd ../backend && npm install
Environment Variables
Configure your .env in the backend folder:

代码段
DATABASE_URL="postgresql://user:pass@localhost:5432/nexusflow"
ANTHROPIC_API_KEY=your_claude_key
JWT_SECRET=your_secret_key
Launch

Bash
# Backend (Port 5000)
cd backend && npm run dev
# Frontend (Port 3000)
cd frontend && npm run dev
🤝 Contributing
We are committed to building a transparent and powerful AI ecosystem. We welcome Pull Requests and Issues!

📄 License
Licensed under the MIT License.
