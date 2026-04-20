# Finance Dashboard

Personal finance dashboard built from an existing Google Sheets workbook.

Google Sheets is the main source of truth. The app will read financial data from the sheet and, in later phases, write selected changes back to it through the backend.

## Stack

- Frontend: Next.js, TypeScript
- Backend: NestJS, TypeScript
- Auth: Firebase Authentication
- Auxiliary database: MongoDB
- Sheets integration: Google Sheets API
- Frontend deploy: Vercel
- Backend deploy: Render

## Workspace

```txt
apps/web       Next.js frontend
apps/api       NestJS backend
packages/shared Shared TypeScript types and helpers
docs           Project decisions and phase notes
```

## Scripts

```bash
pnpm install
pnpm dev:web
pnpm dev:api
pnpm build:web
pnpm build:api
pnpm lint
pnpm typecheck
```

## Phase 1 Goal

This phase only prepares a working monorepo scaffold. It does not implement auth, Google Sheets access, MongoDB models, or the financial dashboard logic yet.
