# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Attack on To-Do's is a Kanban-style todo management app built with the T3 stack (create-t3-app). Users can create, organize, and drag-and-drop todos across status columns (Pending, In Progress, Done) with tagging, priority levels, and due dates. Includes admin panel for user management.

## Commands

- **Dev server:** `npm run dev` (uses Next.js Turbopack)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (or `npm run lint:fix`)
- **Type check:** `npm run typecheck`
- **Lint + type check:** `npm run check`
- **Format:** `npm run format:check` / `npm run format:write`
- **DB push schema:** `npm run db:push`
- **DB migrate (dev):** `npm run db:generate`
- **DB migrate (deploy):** `npm run db:migrate`
- **DB GUI:** `npm run db:studio`
- **Seed:** `npx prisma db seed`

## Tech Stack

- **Framework:** Next.js 15 (App Router) with React 19
- **API:** tRPC v11 with SuperJSON transformer, React Query v5
- **Database:** PostgreSQL via Prisma ORM (client generated to `generated/prisma/`)
- **Auth:** NextAuth v5 (beta) with credentials provider (email/password + bcrypt) and JWT sessions
- **Styling:** Tailwind CSS v4
- **Drag & drop:** @dnd-kit
- **Validation:** Zod (for tRPC inputs and env vars via @t3-oss/env-nextjs)

## Architecture

### Path alias
`~/` maps to `./src/` (configured in tsconfig.json).

### API layer (tRPC)
- **Router definition:** `src/server/api/root.ts` — combines sub-routers: `auth`, `todo`, `tag`, `admin`
- **Procedures & middleware:** `src/server/api/trpc.ts` — defines `publicProcedure`, `protectedProcedure` (requires auth), `adminProcedure` (requires ADMIN role)
- **Router implementations:** `src/server/api/routers/` — each file exports a router
- **Client-side usage:** `import { api } from "~/trpc/react"` (React Query hooks)
- **Server-side usage (RSC):** `import { api } from "~/trpc/server"` (direct caller)

### Auth
- Config in `src/server/auth/config.ts`, exported from `src/server/auth/index.ts`
- Credentials-based auth with Google reCAPTCHA verification on login/signup
- Session augmented with `user.id` and `user.role` via JWT callbacks
- Middleware (`src/middleware.ts`) protects `/todos/*` (requires login) and `/admin/*` (requires ADMIN role)

### Database
- Schema: `prisma/schema.prisma` — models: User, Todo, Tag, Account, Session, VerificationToken
- Prisma client generated to `generated/prisma/` (excluded from tsconfig)
- DB singleton: `src/server/db.ts`
- Enums: `Role` (USER/ADMIN), `Priority` (LOW/MEDIUM/HIGH), `TodoStatus` (PENDING/IN_PROGRESS/DONE)

### Frontend
- Pages: `/` (landing), `/login`, `/signup`, `/todos` (main Kanban board), `/admin`
- Components in `src/app/_components/` organized by feature: `auth/`, `todos/`, `admin/`
- Kanban board uses @dnd-kit for drag-and-drop between status columns with custom collision detection

### Environment Variables
Validated at build time via `src/env.js` using @t3-oss/env-nextjs. Required vars:
- `DATABASE_URL` — MySQL connection string
- `AUTH_SECRET` — required in production
- `RECAPTCHA_SECRET_KEY` / `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

Set `SKIP_ENV_VALIDATION=1` to bypass validation (useful for Docker builds).

## Code Style

- Use `type` imports: `import { type Foo } from "bar"` (inline style, enforced by ESLint)
- Unused vars prefixed with `_` are allowed
- Prettier with tailwindcss plugin for class sorting
