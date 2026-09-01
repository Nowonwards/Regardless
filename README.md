# Regardless - AI Social Media Content Pipeline

A chat-driven social media content creation platform for Instagram, Pinterest, and LinkedIn.

## Features

- **Chat-based Ideation**: Brainstorm post ideas through natural conversation
- **Multi-select Ideas**: Choose multiple ideas at once with checkboxes
- **Draft Generation**: Full post creation with slides, images, and captions
- **Visual Previews**: Rendered previews for each platform (Instagram carousel, Pinterest pin, LinkedIn post)
- **Revision Loop**: Iterate on drafts with chat feedback and version history
- **Approval & Scheduling**: Approve drafts and schedule for publishing
- **Calendar View**: Weekly/monthly calendar with drag-and-drop rescheduling
- **Kanban Board**: Pipeline view with drag-and-drop status updates
- **Post History**: Archive of published posts
- **Platform Connections**: Secure OAuth via Composio for each platform

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Package Manager**: Yarn
- **Database**: PostgreSQL (Docker) with Prisma ORM
- **AI Model**: MiniMax M2.7 via Ollama Cloud (pinned: `minimax-m2.7:cloud`)
- **Image Generation**: Gemini via Composio
- **Publishing**: Composio (Instagram, LinkedIn, Pinterest)
- **Auth**: NextAuth.js
- **UI**: Radix UI + Tailwind CSS
- **State**: Zustand + React hooks

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn
- Docker & Docker Compose
- Ollama Cloud account (for MiniMax M2.7)
- Composio account (for image generation & platform publishing)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd regardless
   yarn install
   ```

2. **Start PostgreSQL**
   ```bash
   docker-compose up -d
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Set up database**
   ```bash
   yarn db:generate
   yarn db:push
   ```

5. **Run development server**
   ```bash
   yarn dev
   ```

6. **Open http://localhost:3000**

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `OLLAMA_BASE_URL` | Ollama API endpoint | Yes |
| `OLLAMA_API_KEY` | Ollama API key | Yes |
| `OLLAMA_MODEL` | Model ID (must be `minimax-m2.7:cloud`) | Yes |
| `COMPOSIO_API_KEY` | Composio API key | Yes |
| `COMPOSIO_BASE_URL` | Composio API base URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) | Yes |
| `NEXTAUTH_URL` | App URL | Yes |
| `NEXT_PUBLIC_APP_URL` | Public app URL | Yes |
| `CRON_SECRET` | Secret for scheduled publishing cron job | Yes |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── chat/             # Chat-based ideation
│   │   ├── ideas/            # Idea selection
│   │   ├── drafts/           # Draft review & revision
│   │   ├── calendar/         # Calendar view
│   │   ├── kanban/           # Kanban board
│   │   ├── history/          # Published posts history
│   │   └── settings/         # User settings & platform connections
│   ├── api/                  # API routes
│   │   ├── chat/             # Chat streaming
│   │   ├── ideas/            # Idea CRUD
│   │   ├── drafts/           # Draft CRUD + generation
│   │   ├── calendar/         # Calendar queries
│   │   ├── kanban/           # Kanban queries
│   │   ├── history/          # History queries
│   │   ├── platforms/        # Platform OAuth
│   │   ├── sessions/         # Chat sessions
│   │   └── cron/             # Scheduled publishing job
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Redirect to /chat
│   ├── globals.css           # Global styles
│   └── providers.tsx         # React providers
├── components/
│   ├── ui/                   # Base UI components (Radix + Tailwind)
│   ├── chat/                 # Chat interface & idea selector
│   ├── drafts/               # Draft list & preview
│   ├── calendar/             # Calendar view
│   ├── kanban/               # Kanban board with dnd-kit
│   ├── history/              # History view
│   ├── platform/             # Platform connections
│   └── layout/               # Sidebar, header, app layout
├── lib/
│   ├── prisma.ts             # Prisma client
│   ├── ollama.ts             # MiniMax M2.7 integration
│   ├── composio.ts           # Composio integration
│   ├── publisher.ts          # Platform publisher adapters
│   ├── auth.ts               # NextAuth config
│   ├── agents/               # LangGraph agents
│   │   ├── prompts.ts        # Stage-specific prompts
│   │   └── graph.ts          # LangGraph workflow
│   └── jobs/                 # Background jobs
│       └── scheduler.ts      # Scheduled publishing
├── hooks/                    # Custom React hooks
└── types/                    # TypeScript types
```

## Pipeline Flow

1. **Chat Ideation** → User chats with AI strategist to brainstorm ideas
2. **Multi-select** → User selects multiple ideas via checkboxes
3. **Draft Generation** → AI generates full posts (slides + images + captions)
4. **Draft Review** → Visual previews with revision chat
5. **Approval** → User approves drafts
6. **Scheduling** → Set date/time per platform
7. **Calendar/Kanban** → View scheduled posts
8. **Background Job** → Cron publishes at scheduled time via Composio
9. **History** → Published posts archive

## Platform Publishing

Each user connects their own accounts via Composio OAuth:
- Instagram: Carousel posts
- Pinterest: Pin images
- LinkedIn: Single image or text posts

Publishing runs as a background cron job (configure with your scheduler):
```bash
# Example: Run every minute
* * * * * curl -X POST http://localhost:3000/api/cron/publish \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Development

```bash
# Run dev server
yarn dev

# Run linting
yarn lint

# Database commands
yarn db:generate    # Generate Prisma client
yarn db:push        # Push schema changes
yarn db:migrate     # Run migrations
yarn db:studio      # Open Prisma Studio
```

## Deployment

1. Build the app: `yarn build`
2. Start production: `yarn start`
3. Configure cron job for scheduled publishing
4. Set up PostgreSQL (managed service recommended)
5. Configure environment variables in production

## License

MIT