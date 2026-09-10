# Regardless — Autonomous AI Social Media Content & Publishing Engine

> **Regardless** is an autonomous, high-signal content studio and publishing engine built for tech educators, founders, and developer advocates. It transforms breaking tech news and industry developments into production-grade multi-slide carousels, visual pins, and thought-leadership posts across Instagram, LinkedIn, and Pinterest with zero manual busywork.

---

## 📑 Table of Contents

1. [Executive Summary & Core Philosophy](#1-executive-summary--core-philosophy)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
3. [Complete Feature Breakdown & Step-by-Step Workflows](#3-complete-feature-breakdown--step-by-step-workflows)
   - [3.1 Authentication & Workspace Gateway](#31-authentication--workspace-gateway)
   - [3.2 Social Platform Connections (Composio OAuth)](#32-social-platform-connections-composio-oauth)
   - [3.3 Content Studio (`/chat`) — 3 Production Modes](#33-content-studio-chat--3-production-modes)
   - [3.4 Global Ideas Repository (`/ideas`)](#34-global-ideas-repository-ideas)
   - [3.5 Drafts Studio & Visual Slide Deck Editor (`/drafts`)](#35-drafts-studio--visual-slide-deck-editor-drafts)
   - [3.6 Pipeline Kanban Board (`/kanban`)](#36-pipeline-kanban-board-kanban)
   - [3.7 Content Calendar & Drag-and-Drop Scheduler (`/calendar`)](#37-content-calendar--drag-and-drop-scheduler-calendar)
   - [3.8 Autonomous Background Scheduler & Concurrency Lock](#38-autonomous-background-scheduler--concurrency-lock)
   - [3.9 Multi-Platform Publishing Engine (`src/lib/publisher.ts`)](#39-multi-platform-publishing-engine-srclibpublisherts)
   - [3.10 Published Post History & Performance Archive (`/history`)](#310-published-post-history--performance-archive-history)
   - [3.11 Real-Time Notifications System](#311-real-time-notifications-system)
   - [3.12 Clean Brutalist Design System & Theming](#312-clean-brutalist-design-system--theming)
4. [Technology Stack & Key Integrations](#4-technology-stack--key-integrations)
5. [Database Schema & Data Model Reference](#5-database-schema--data-model-reference)
6. [API Route Catalog](#6-api-route-catalog)
7. [Environment Variables & Configuration](#7-environment-variables--configuration)
8. [Local Development & Deployment Guide](#8-local-development--deployment-guide)

---

## 1. Executive Summary & Core Philosophy

Regardless is engineered around the **Autonomous Intelligence Loop** — an opinionated, end-to-end workflow designed to eliminate friction in social content creation:

1. **Idea Discovery (Radar)**: Continuous, real-time tech news ideation using Tavily AI Search and Ollama Cloud LLM (`minimax-m2.7:cloud`).
2. **Visual Deck Generation (Studio)**: Automated generation of structured carousel decks, complete with slide headlines, body copy, image generation prompts, and custom OpenGraph/SVG image rendering.
3. **Autonomous Dispatch (Queue)**: Zero-click scheduling and direct multi-platform API publishing via Composio with background workers and concurrency locking.

### Clean Brutalist Design Standard
Regardless adopts a strict **clean brutalist** visual identity:
* **Zero border-radius (`rounded-none`)** across all cards, modals, inputs, buttons, and popovers.
* **Hard 1px borders (`border-border`)** in high-contrast palettes.
* **Signature Acid Lime Accent (`#C6FF3D`)** for primary interactive states.
* **Distinct Surface / Background Layers** (`#0B0B0C` background and `#141416` surface in dark mode; `#F7F7F5` and `#FFFFFF` in light mode).
* **Imperial Script Masthead** for the brand wordmark (*Regardless*), paired with Space Grotesk, Inter, and JetBrains Mono.

---

## 2. End-to-End System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (Next.js 14 App Router)"]
        A["Clerk / NextAuth Gateway\n(/sign-in, /sign-up)"]
        B["Content Studio (/chat)\nMode A: AI Chat\nMode B: News Form\nMode C: Manual Studio"]
        C["Ideas Repository (/ideas)"]
        D["Drafts & Slide Editor (/drafts)"]
        E["Kanban Pipeline (/kanban)"]
        F["Interactive Calendar (/calendar)"]
        G["History Archive (/history)"]
        H["Settings & OAuth (/settings)"]
    end

    subgraph API ["Backend API Layer (/api/*)"]
        AuthLayer["getAuthUser() Guard\n(Clerk + NextAuth Sync)"]
        ChatAPI["/api/chat\n(SSE Streaming)"]
        DraftsAPI["/api/drafts\n(CRUD, Revision, Batch)"]
        KanbanAPI["/api/kanban"]
        CalendarAPI["/api/calendar"]
        PlatformsAPI["/api/platforms\n(Composio OAuth)"]
        PostsAPI["/api/posts\n(Direct Publishing)"]
        CronAPI["/api/cron/publish"]
    end

    subgraph Intelligence ["AI & External Services"]
        Tavily["Tavily AI Search\n(Live News & Entity Extraction)"]
        Ollama["Ollama Cloud\n(minimax-m2.7:cloud)"]
        Composio["Composio SDK\n(Social OAuth & Dispatch)"]
        Sharp["Sharp Engine\n(JPEG / Buffer Optimization)"]
    end

    subgraph Background ["Daemons & Storage"]
        Scheduler["Background Scheduler Daemon\n(Node setInterval 30s)"]
        DB[("PostgreSQL\n(Prisma ORM)")]
    end

    Client --> AuthLayer
    AuthLayer --> ChatAPI & DraftsAPI & KanbanAPI & CalendarAPI & PlatformsAPI & PostsAPI
    ChatAPI <--> Tavily
    ChatAPI <--> Ollama
    DraftsAPI <--> Ollama
    PlatformsAPI <--> Composio
    PostsAPI <--> Sharp
    PostsAPI <--> Composio
    Scheduler --> CronAPI
    CronAPI --> PostsAPI
    API <--> DB
```

---

## 3. Complete Feature Breakdown & Step-by-Step Workflows

### 3.1 Authentication & Workspace Gateway
* **Routes**: `/sign-in`, `/sign-up`, `/sign-out`
* **Implementation**: Clerk (`@clerk/nextjs`) unified with NextAuth & PostgreSQL.
* **Key Features**:
  * **Unified Auth Guard (`src/lib/auth.ts` -> `getAuthUser()`)**: Seamlessly verifies incoming Clerk sessions (and fallback NextAuth tokens), automatically provisioning or linking Prisma `User` records so relational foreign keys are preserved.
  * **Middleware Protection (`src/middleware.ts`)**: Unauthenticated web requests redirect (`307`) to `/sign-in`, while unauthenticated API calls return `401 Unauthorized`.
  * **Brutalist Auth Interface**: High-contrast split-screen terminal frame featuring the Imperial Script brand wordmark, live system indicators, and zero-radius Clerk components with dark surface integration.

---

### 3.2 Social Platform Connections (Composio OAuth)
* **Route**: `/settings`
* **Supported Channels**:
  * **Instagram Business / Creator**: Carousel container publishing and single-image posts.
  * **LinkedIn**: Company page & personal profile updates with image attachments.
  * **Pinterest**: High-converting vertical pins (2:3 aspect ratio) mapped to specific boards.
* **Step-by-Step Workflow**:
  1. User navigates to `/settings`.
  2. Clicks **"Connect"** on a target platform card.
  3. Frontend triggers `POST /api/platforms`, initiating an OAuth flow via Composio.
  4. User approves permissions on the third-party OAuth screen.
  5. Callback updates `PlatformConnection` in PostgreSQL to `CONNECTED` status.
  6. The connection is immediately available across all ideation, drafting, and scheduling pipelines.

---

### 3.3 Content Studio (`/chat`) — 3 Production Modes
* **Route**: `/chat`
* **Overview**: The central command center for generating and curating high-signal social content.

#### Mode A: Conversational AI Chat & Ideation
* **Natural Language Brainstorming**: Prompt the AI strategist (e.g. *"Give me 3 spicy takes on AI code generation tools vs junior developers"*).
* **Multi-Stage Resilient Tavily Search**:
  1. `determineSearchQueryWithLLM` formulates optimal search entities from the prompt.
  2. Executes Tavily search with `topic: 'news'`.
  3. If 0 articles are found (e.g. emerging unannounced models like *"GPT-6 Astra"*), automatically falls back to `topic: 'general'`.
  4. If still empty, runs heuristic keyword extraction (`buildTechNewsSearchQuery`) to guarantee real-world grounding.
* **In-Stream Interactive Checkbox Cards**: Each generated idea renders as an interactive card in the chat stream with checkboxes for individual or batch drafting.
* **Session Management**: Automatically names chat sessions based on extracted topics and maintains conversation history in PostgreSQL.

#### Mode B: News Ideation Form
* **Structured Parameters**: Select platform pills, topic focus (*All Tech News*, *AI Models*, *Dev Tools*, *Startups/VC*, *Big Tech Drama*), idea count (3 to 6), and custom keywords.
* **Direct Batch Generation**: Synthesizes live search results and outputs structured ideas with a single click **"Create Drafts"** button.

#### Mode C: Manual Post Studio ("Create by Myself")
* **Bypass Ideation**: Directly create custom posts by specifying title, caption, hashtags, platform, and slide visual prompts.
* **Immediate Actions**: Save directly to `APPROVED`, schedule to calendar, or publish live instantly.

---

### 3.4 Global Ideas Repository (`/ideas`)
* **Route**: `/ideas`
* **Features**:
  * Persistent storage for all ideas generated across all chat sessions.
  * Filter by **Platform** (`INSTAGRAM`, `LINKEDIN`, `PINTEREST`) and **Status** (`IDEA`, `SELECTED`, `DRAFTED`).
  * Checkbox multi-select toolbar enabling batch generation of drafts across multiple ideas simultaneously.

---

### 3.5 Drafts Studio & Visual Slide Deck Editor (`/drafts`)
* **Route**: `/drafts`
* **Capabilities**:
  * **Platform-Specific Mockups**:
    * **Instagram**: Interactive mobile phone frame simulating swipeable multi-slide carousels (1:1 / 4:5 aspect ratios).
    * **LinkedIn**: Desktop / mobile feed card mockup.
    * **Pinterest**: 2:3 vertical pin preview.
  * **Slide Deck Controls**:
    * Add, remove, and reorder slides.
    * Edit slide headline, body text, and AI image generation prompts.
    * Toggle slide visual modes: `Template (SVG/OG)` vs `AI Generated Image (Composio Gemini)`.
  * **AI Revision Loop**: Enter natural language feedback in the revision sidebar (e.g., *"Make slide 3 punchier and add code snippet formatting"*). The system sends the current draft state and prompt to Ollama, creating a new `PostVersion` record while preserving full rollback history.
  * **Actions**: **"Approve & Schedule"**, **"Publish Live"**, or **"Delete Draft"**.

---

### 3.6 Pipeline Kanban Board (`/kanban`)
* **Route**: `/kanban`
* **Workflow Columns**:
  1. `IDEA` — Conceptual proposals
  2. `SELECTED` — Ideas earmarked for production
  3. `DRAFTED` — Full copy & slide generation completed
  4. `IN_REVISION` — Iterating on feedback
  5. `APPROVED` — Content verified and ready for scheduling
  6. `SCHEDULED` — Queued for automatic future dispatch
  7. `POSTED` — Live on social platforms
  8. `FAILED` — Encountered API or publishing error
* **Interactions**: Drag-and-drop cards between status columns; click any card to inspect details or trigger immediate actions.

---

### 3.7 Content Calendar & Drag-and-Drop Scheduler (`/calendar`)
* **Route**: `/calendar`
* **Features**:
  * **Views**: Monthly grid and Weekly timeline.
  * **Drag-and-Drop Rescheduling**: Drag post cards to new dates/time slots; updates `scheduledAt` in PostgreSQL instantly via `PATCH /api/calendar`.
  * **Platform Filter**: Color-coded badges for Instagram, LinkedIn, and Pinterest.
  * **Unscheduled Drafts Drawer**: Quick-schedule approved drafts by dragging them onto the calendar.

---

### 3.8 Autonomous Background Scheduler & Concurrency Lock
* **Source**: `src/lib/jobs/scheduler.ts` and `src/instrumentation.ts`
* **How It Works**:
  1. **Automatic Daemon Startup**: On Next.js server boot (`register()` in `src/instrumentation.ts`), a background scheduler daemon starts running on a 30-second interval (`setInterval`).
  2. **Querying Due Posts**: Finds posts where `status = 'SCHEDULED'` and `scheduledAt <= NOW()`.
  3. **Concurrency Locking (`publishingStartedAt`)**:
     - Atomically marks `publishingStartedAt = NOW()` to ensure that multi-instance or rapid cron triggers never publish duplicate posts.
     - Automatically clears stale locks if a previous execution crashed (5-minute lock timeout).
  4. **Dispatch & Notification**: Calls `publishPost()` for each due post, updates status to `POSTED` (or `FAILED`), and sends in-app notifications.

---

### 3.9 Multi-Platform Publishing Engine (`src/lib/publisher.ts`)
* **Source**: `src/lib/publisher.ts` & `src/lib/composio.ts`
* **Publishing Mechanics**:
  * **Sharp Image Optimization**: Converts all slide images into compliant JPEG buffers (resolving orientation, color space, and dimensions).
  * **Instagram Carousels**:
    1. Uploads individual slide images via Composio media endpoints to create item containers.
    2. Packages item containers into an Instagram Carousel Container.
    3. Publishes the carousel container with caption and hashtags.
  * **LinkedIn Posts**: Publishes single or multi-image thought-leadership posts directly to the user's profile/organization feed.
  * **Pinterest Pins**: Publishes 2:3 vertical pins attached to the designated board with SEO title and link.
  * **Audit Log**: Every attempt is logged in the `PublishAttempt` table with exact API response payloads or error messages.

---

### 3.10 Published Post History & Performance Archive (`/history`)
* **Route**: `/history`
* **Features**:
  * Complete timeline archive of all successfully published social posts.
  * Filter by platform and date range.
  * Direct links to live posts on Instagram, LinkedIn, and Pinterest.
  * Displays publish timestamps, version numbers, and carousel slide breakdowns.

---

### 3.11 Real-Time Notifications System
* **Routes**: `/api/notifications`
* **Features**:
  * Tracks key events: `POST_PUBLISHED`, `POST_FAILED`, `POST_SCHEDULED`, `INFO`.
  * Header bell icon with live unread badge counter.
  * Mark individual or all notifications as read.

---

### 3.12 Clean Brutalist Design System & Theming
* **Tokens & Configuration**: `src/app/globals.css` and `tailwind.config.ts`
* **Color Palette**:
  * **Acid Lime Brand Primary**: `#C6FF3D` / `hsl(74 100% 62%)` (consistent across dark and light modes).
  * **Dark Mode**: Background `#0B0B0C`, Surface `#141416`, Foreground `#F2F2F0`, Border `#28282C`.
  * **Light Mode**: Background `#F7F7F5`, Surface `#FFFFFF`, Foreground `#0B0B0C`, Hard Black Border `#111113`.
* **Typography Stack**:
  * Brand Masthead: **Imperial Script** (`font-wordmark`, 400 weight).
  * Headings: **Space Grotesk** (`font-display`).
  * Body Text: **Inter** (`font-sans`).
  * Code & Metrics: **JetBrains Mono** (`font-mono`).

---

## 4. Technology Stack & Key Integrations

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Fullstack React framework with Server Components & Route Handlers |
| **Language** | TypeScript | Strict type safety across client, server, and database |
| **Package Manager** | Yarn (v1.22+) | Deterministic dependency management |
| **Database** | PostgreSQL | Relational storage for users, sessions, posts, versions, and metrics |
| **ORM** | Prisma | Type-safe query building and database migrations |
| **Authentication** | Clerk (`@clerk/nextjs`) + NextAuth fallback | Dual auth support with route middleware and Prisma user sync |
| **LLM Engine** | Ollama Cloud (`minimax-m2.7:cloud`) | Ideation, drafting, and conversational revision loops |
| **Web Search** | Tavily AI Search | Real-time tech news discovery, fact-checking, and entity extraction |
| **Social & Actions** | Composio SDK | Social OAuth connections, Gemini image generation, and multi-platform publishing |
| **Image Processing** | Sharp | Server-side JPEG compression, buffer conversion, and dimension standardization |
| **Dynamic Visuals** | Next.js OpenGraph / SVG (`/api/og/slide`) | Dynamic template slide generation for social carousels |
| **Styling** | Tailwind CSS + CSS Variables | Clean brutalist design system with dark/light themes |
| **Icons** | Lucide React | High-contrast brutalist icon set |

---

## 5. Database Schema & Data Model Reference

```
User (id, email, name, image, createdAt, updatedAt)
 ├── PlatformConnection (userId, platform, composioUserId, status, accessToken, expiresAt)
 ├── ChatSession (userId, title, dateRangeStart, dateRangeEnd)
 │    ├── ChatMessage (sessionId, role, content, metadata)
 │    └── Idea (userId, sessionId, platform, title, description, content, status, selected)
 ├── Post (userId, ideaId, platform, status, title, content, scheduledAt, publishedAt, publishingStartedAt, currentVersion)
 │    ├── PostVersion (postId, version, content, feedback)
 │    └── PublishAttempt (postId, platform, status, response, error, attemptedAt, completedAt)
 └── Notification (userId, title, message, type, platform, postId, read, createdAt)
```

### Entity Descriptions
* **`User`**: Root user entity linked to Clerk and NextAuth credentials.
* **`PlatformConnection`**: Stores OAuth tokens and Composio account IDs per social platform.
* **`ChatSession` & `ChatMessage`**: Persists conversation history, Tavily search sources, and session titles.
* **`Idea`**: Stores structured post concepts (hooks, sarcastic angles, format) generated during ideation.
* **`Post`**: Main content entity representing a multi-slide carousel, pin, or post with JSON slide content.
* **`PostVersion`**: Immutable version snapshots created on every AI revision loop.
* **`PublishAttempt`**: Diagnostic log for every direct or automated dispatch attempt.
* **`Notification`**: Real-time user alert records for published or failed posts.

---

## 6. API Route Catalog

| Route | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/chat` | `POST` | Yes | SSE streaming endpoint for AI ideation and Tavily news search |
| `/api/chat/history` | `GET` | Yes | Fetches conversation messages for a given `sessionId` |
| `/api/sessions` | `GET`, `POST` | Yes | Lists active chat sessions or creates a new session |
| `/api/ideas` | `GET`, `POST`, `PATCH` | Yes | Queries, batch creates, or toggles selection status of post ideas |
| `/api/drafts` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Yes | Full CRUD, batch generation, revision loop, and status updates for drafts |
| `/api/kanban` | `GET`, `PATCH` | Yes | Fetches cards grouped by status and handles drag-and-drop column transitions |
| `/api/calendar` | `GET`, `PATCH` | Yes | Queries posts within a date range and reschedules `scheduledAt` timestamps |
| `/api/posts` | `POST` | Yes | Triggers direct social media publishing via Composio |
| `/api/platforms` | `GET`, `POST`, `DELETE`, `PATCH` | Yes | Manages Composio OAuth connections for Instagram, LinkedIn, and Pinterest |
| `/api/images/generate` | `POST` | Yes | Generates slide images via Composio Gemini / OG engine |
| `/api/images/upload` | `POST` | Yes | Handles user image uploads and Sharp JPEG optimization |
| `/api/notifications` | `GET`, `PATCH` | Yes | Fetches user notifications and marks items as read |
| `/api/cron/publish` | `GET`, `POST` | Secret / Daemon | Cron endpoint for publishing due scheduled posts |
| `/api/og/slide` | `GET` | No | Dynamic OpenGraph / SVG slide image rendering endpoint |

---

## 7. Environment Variables & Configuration

Create a `.env` file in the root directory based on `.env.example`:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/regardless?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/chat"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/chat"

# NextAuth (Fallback Support)
NEXTAUTH_SECRET="your-32-byte-base64-secret"
NEXTAUTH_URL="http://localhost:3000"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI Model via Ollama Cloud
OLLAMA_BASE_URL="https://cloud.ollama.com"
OLLAMA_API_KEY="your-ollama-cloud-api-key"
OLLAMA_MODEL="minimax-m2.7:cloud"

# Web Search
TAVILY_API_KEY="tvly-..."

# Social Publishing & Image Generation via Composio
COMPOSIO_API_KEY="your-composio-api-key"
COMPOSIO_BASE_URL="https://backend.composio.dev/api/v1"

# Background Cron
CRON_SECRET="your-cron-secret-token"
```

---

## 8. Local Development & Deployment Guide

### Prerequisites
* **Node.js**: `18.0.0` or higher
* **Yarn**: `1.22+`
* **Docker & Docker Compose** (for PostgreSQL)

### Quick Start
```bash
# 1. Clone repository and install dependencies
git clone https://github.com/Nowonwards/Regardless.git
cd Regardless
yarn install

# 2. Start PostgreSQL container
docker-compose up -d

# 3. Synchronize Prisma Database Schema
yarn db:generate
yarn db:push

# 4. Start Development Server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to access Regardless.

### Verification Commands
```bash
# Type check without emitting
yarn tsc --noEmit

# Production build verification
yarn build

# Run background scheduler check
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/publish
```

---
*Maintained by Regardless Engineering — Built with Next.js 14, Ollama Cloud, Tavily, Composio, and PostgreSQL.*
