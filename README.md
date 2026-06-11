# SPIL Intelligence — SPIL Opti (Phase 1)

Internal engineering and knowledge platform for SPIL Labs.

## Quick Start

```bash
# Install root dependencies (optional, for concurrent dev)
npm install

# Backend
cd backend
npm install
npm run db:migrate
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Or from root: `npm run dev` (requires `npm install` at root first).

## Environment

**backend/.env**
```
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="your-key-here"
PORT=3001
```

**frontend/.env**
```
VITE_API_URL=http://localhost:3001/api/v1
```

## Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v3, Framer Motion, React Router v6, Zustand, TanStack Query
- **Backend:** Node.js, Express, TypeScript, Prisma, SQLite (local dev)
- **AI:** Anthropic Claude API (streaming)

## Phase 1 Modules

Dashboard · Projects · Knowledge Base · Research · Ideas · Decisions · Algorithms · Tasks · Bugs · Documents · AI Assistant · Settings
