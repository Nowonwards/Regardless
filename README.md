# Regardless — AI Social Media Content Pipeline

An autonomous, multi-platform social media publishing and ideation workspace built with **Next.js 14 (App Router)**, **Clerk Authentication**, **Prisma ORM**, **Composio**, and **Ollama Cloud**.

Designed for high-signal tech founders and developers to ideate from live news feeds, design visual multi-slide carousels via code, and publish seamlessly across **Instagram**, **LinkedIn**, and **Pinterest**.

---

## Key Features

- **Public Editorial Landing Page (`/`)**: High-contrast, brutalist marketing page featuring real-time system status badges, responsive layouts, and light/dark theme toggles.
- **Authenticated Overview Dashboard (`/overview`)**: Live workspace dashboard with pipeline metric counters, active draft carousels, upcoming scheduled posts, and immediate server action publish/retry triggers.
- **AI News Radar & Ideation (`/chat`)**:
  - Conversational brainstorming with MiniMax M2.7 via Ollama Cloud.
  - Live tech news discovery powered by the Tavily Search API.
  - Multi-idea checkbox selection with instant draft generation.
  - Dedicated News Ideation Form & Manual Post Studio tabs.
- **In-Memory Satori Slide Deck Engine (`/api/og/slide`)**:
  - Dynamically renders code-driven 1080x1350 slide cards using Satori and `@vercel/og`.
  - In-memory rendering buffer pipeline (`@/lib/og/slide-generator.tsx`) guarantees zero external network roundtrips during Instagram publishing, completely bypassing Vercel deployment SSO/authentication blocks.
- **Draft Studio & Platform Previews (`/drafts`)**: Real-time visual previews for Instagram carousel decks, LinkedIn posts, and Pinterest pins with revision loops and slide reordering.
- **Publishing & Scheduling (`/calendar` & `/kanban`)**:
  - Drag-and-drop rescheduling in weekly/monthly calendar views.
  - Multi-column pipeline Kanban board powered by `@dnd-kit`.
  - Automated background publishing via Vercel Cron (`/api/cron/publish`).
- **OAuth & Platform Management (`/settings`)**: Seamless multi-account authentication and publishing via Composio SDK with environment-aware callback URLs.

---

## Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | Next.js 14.2 (App Router, Server Actions, React 18) |
| **Language** | TypeScript (Strict mode) |
| **Styling** | Vanilla CSS Modules + Tailwind CSS + Radix UI Primitives |
| **Authentication** | Clerk (`@clerk/nextjs`) with brutalist dark/light theme |
| **Database & ORM** | PostgreSQL 16 with Prisma ORM (`@prisma/client`) |
| **AI Synthesis** | MiniMax M2.7 via Ollama Cloud (`minimax-m2.7:cloud`) |
| **Live News Search**| Tavily Search API (`@langchain/core`, LangGraph) |
| **Social Publishing**| Composio SDK (`@composio/core`) |
| **Slide Generation**| `@vercel/og` (Satori) + `sharp` image optimization |
| **Testing** | Jest + React Testing Library (`yarn test:ci`) |
| **Deployment** | Vercel (Production + Preview Deployments) + GitHub Actions CI/CD |

---

## Database Architecture

Regardless employs a clean dual-tier database configuration:

1. **Local Development (Docker)**:
   - Self-contained PostgreSQL 16 Alpine container managed via `docker-compose.yml`.
   - Run `yarn db:up` to spin up the local database on `localhost:5432`.
2. **Production & Staging (Supabase)**:
   - **Transaction Pooler (`DATABASE_URL`)**: Connects via PgBouncer on port `6543` with `?pgbouncer=true` for serverless function scaling.
   - **Session Pooler (`DIRECT_URL`)**: Direct connection on port `5432` used by the Prisma migration and schema engines.

---

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher (v20+ recommended)
- **Package Manager**: Yarn (`v1.22+`)
- **Docker & Docker Compose**: For local PostgreSQL container
- **Accounts**:
  - [Clerk](https://clerk.com) (Authentication)
  - [Ollama Cloud](https://ollama.com) (MiniMax M2.7 AI model)
  - [Composio](https://composio.dev) (Platform OAuth & publishing)
  - [Tavily](https://tavily.com) (Live tech news search)

### Step-by-Step Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Nowonwards/Regardless.git
   cd Regardless
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Start local PostgreSQL container**:
   ```bash
   yarn db:up
   # To stop: yarn db:down
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Populate your API keys and credentials in .env
   ```

5. **Generate Prisma Client and push schema**:
   ```bash
   yarn db:generate
   yarn db:push
   ```

6. **Start the local development server**:
   ```bash
   yarn dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables Reference

| Variable | Description | Stage / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Pooled PostgreSQL connection string | `postgresql://regardless:regardless_dev@localhost:5432/regardless?schema=public` (Local)<br>`postgresql://postgres.[ref]:[pass]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true` (Production) |
| `DIRECT_URL` | Direct PostgreSQL connection string | Same as `DATABASE_URL` for local Docker.<br>Port `5432` on Supabase pooler for Production. |
| `NEXT_PUBLIC_APP_URL` | Application base URL | `http://localhost:3000` (Local)<br>`https://regardless-git-develop-[team].vercel.app` (Preview)<br>`https://regardless-three.vercel.app` (Production) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Frontend API key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk Backend API key | `sk_test_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Clerk Sign In path | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Clerk Sign Up path | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Post sign-in destination | `/overview` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Post sign-up destination | `/overview` |
| `OLLAMA_BASE_URL` | Ollama API base URL | `http://127.0.0.1:11434` or cloud endpoint |
| `OLLAMA_MODEL` | Pinned AI model | `minimax-m2.7:cloud` |
| `OLLAMA_API_KEY` | Ollama Cloud authentication | `sk_...` |
| `COMPOSIO_API_KEY` | Composio API key | `ak_...` |
| `TAVILY_API_KEY` | Tavily News Search key | `tvly-...` |
| `CRON_SECRET` | Bearer token for scheduled publishing | `your-secure-cron-secret` |

---

## Available Scripts

| Script | Purpose |
| :--- | :--- |
| `yarn dev` | Starts Next.js development server on port 3000 |
| `yarn build` | Generates optimized production build |
| `yarn start` | Runs production server |
| `yarn lint` | Executes ESLint analysis |
| `yarn test:ci` | Runs full Jest unit test suite |
| `yarn db:up` | Starts Docker PostgreSQL container in background |
| `yarn db:down` | Stops Docker PostgreSQL container |
| `yarn db:generate`| Generates Prisma Client (`@prisma/client`) |
| `yarn db:push` | Synchronizes Prisma schema directly with the database |
| `yarn db:migrate` | Runs Prisma schema migrations |
| `yarn db:studio` | Opens visual Prisma Studio interface |

---

## Project Structure

```
regardless/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions CI/CD (Test, Lint, Deploy)
├── prisma/
│   └── schema.prisma             # Database schema (Models, Enums, Datasource)
├── public/                       # Static public assets (icons, brand marks)
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Authenticated App Shell
│   │   │   ├── overview/         # Overview dashboard & server actions
│   │   │   ├── chat/             # Chat ideation, news form, manual studio
│   │   │   ├── ideas/            # Multi-select idea cards
│   │   │   ├── drafts/           # Draft review, slide preview, scheduling
│   │   │   ├── calendar/         # Drag-and-drop calendar
│   │   │   ├── kanban/           # Pipeline status Kanban board
│   │   │   ├── history/          # Published posts archive
│   │   │   └── settings/         # Composio platform connection manager
│   │   ├── (marketing)/          # Public landing page with theme toggle
│   │   ├── api/                  # API route handlers
│   │   │   ├── chat/             # AI streaming & session history
│   │   │   ├── cron/publish/     # Scheduled post publisher endpoint
│   │   │   ├── drafts/           # Draft generation & CRUD
│   │   │   ├── og/slide/         # Dynamic 1080x1350 slide card generator
│   │   │   └── platforms/        # Composio OAuth initiate & disconnect
│   │   ├── sign-in/              # Clerk sign-in page
│   │   ├── sign-up/              # Clerk sign-up page
│   │   ├── globals.css           # Design tokens, color themes & base resets
│   │   ├── layout.tsx            # Root layout with ClerkProvider
│   │   └── middleware.ts         # Clerk route protection & public route matcher
│   ├── components/
│   │   ├── calendar/             # Calendar view components
│   │   ├── chat/                 # ChatInterface, NewsIdeationForm, Studio
│   │   ├── drafts/               # DraftPreview, DraftsList, ScheduleModal
│   │   ├── kanban/               # KanbanBoard with dnd-kit
│   │   ├── layout/               # Sidebar, Header, Logo, AppLayout
│   │   ├── platform/             # Platform connection cards
│   │   └── ui/                   # Brutalist Radix UI primitive wrappers
│   ├── lib/
│   │   ├── auth.ts               # getAuthUser resolver (Clerk + NextAuth fallback)
│   │   ├── composio.ts           # Composio client & multi-platform publishers
│   │   ├── ollama.ts             # Ollama API client
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── publisher.ts          # Media URL formatting & platform adapters
│   │   ├── url.ts                # Dynamic stage-aware application URL resolver
│   │   └── og/
│   │       └── slide-generator.tsx # Satori slide layout & in-memory buffer renderer
│   └── types/                    # Shared TypeScript interfaces & enums
├── tests/                        # Jest test suites (utils, url, slide-generator, etc.)
├── docker-compose.yml            # Local PostgreSQL 16 container definition
└── package.json
```

---

## Git Workflow & CI/CD

Regardless enforces a disciplined Git branching model:

1. **`develop` Branch**: All active features, fixes, and improvements are committed and pushed to `develop`. Direct pushes to `main` are prohibited.
2. **Automated CI Checks**: Every push to `develop` runs:
   - TypeScript compiler validation (`yarn tsc --noEmit`)
   - ESLint code quality analysis (`yarn lint`)
   - Jest automated unit test suite (`yarn test:ci`)
3. **Pull Requests**: Pull requests are opened from `develop` targeting `main`.
4. **Vercel Environments**:
   - Pushes to `develop` trigger automatic **Preview Deployments**.
   - Merging `develop` into `main` automatically deploys to **Production**.

---

## License

MIT © [Regardless Technologies](https://regardless.ai)