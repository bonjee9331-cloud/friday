# FRIDAY OS — Agent Instructions

> Read this file before writing a single line of code. It is the map.
> Following it means every file you create lands in the right place and follows the right patterns.

## What this project is

FRIDAY is Ben Lynch's personal AI operating system. A Next.js 14 App Router application deployed on Netlify with Supabase for memory. It merges two prior systems:

- **BOB** — Ben's voice-activated personal AI assistant (sharp, Aussie, JARVIS-like). BOB handles life admin, sales coaching, job hunting, planning — everything.
- **Job Autopilot** — Automated job searching, application tracking, interview prep, fit scoring.

The app is protected by a cinematic FRIDAY voice lock screen. Passphrase: "biblical" (configurable via `FRIDAY_PASSWORD` env var). Auth is server-side (httpOnly cookie set by `/api/auth/login`). Middleware protects all routes.

## Folder structure — where things live

```
friday/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.js       ← POST — validates passphrase, sets session cookie
│   │   │   └── logout/route.js      ← POST — clears session cookie
│   │   ├── friday/
│   │   │   ├── chat/route.js        ← POST — master AI brain endpoint
│   │   │   ├── voice/route.js       ← POST — ElevenLabs TTS passthrough
│   │   │   ├── telegram/route.js    ← POST — Telegram webhook
│   │   │   └── tasks/route.js       ← CRUD — task management
│   │   ├── bob/
│   │   │   └── brief/route.js       ← GET — generates daily sales briefing
│   │   ├── briefing/route.js        ← GET — morning briefing for boot screen
│   │   ├── weather/route.js         ← GET — Hua Hin weather for boot screen
│   │   ├── markets/route.js         ← GET — global markets for boot screen
│   │   └── news/route.js            ← GET — headlines for boot screen
│   ├── page.js                      ← Root page — renders FridayApp (lock + boot + dashboard)
│   ├── layout.js                    ← Root layout — wraps everything in HudShell
│   ├── globals.css                  ← All CSS — design tokens, arc reactor, HUD animations
│   └── [page]/page.js               ← Each section (bob, jobs, tasks, brain, etc.)
│
├── components/
│   ├── FridayApp.js                 ← State machine: locked → booting → ready
│   ├── LockScreen.js                ← Voice/passphrase gate — calls /api/auth/login
│   ├── BootSequence.js              ← Cinematic boot with music, weather, news panels
│   ├── Dashboard.js                 ← Main command grid (left panel)
│   ├── ChatUI.js                    ← Neural thread / BOB chat (right panel)
│   ├── BobDashboard.js              ← D2MS HelloFresh sales floor
│   ├── HudShell.js                  ← Full-screen HUD wrapper
│   ├── HudRail.js                   ← Left navigation rail
│   ├── HudTopbar.js                 ← Top status bar
│   └── [others].js                  ← TasksUI, JobsView, etc.
│
├── lib/
│   ├── session.js                   ← Session token generation and validation
│   ├── auth.js                      ← API route auth helper (MANAGER_AUTH_KEY)
│   ├── brain.js                     ← Claude AI caller — all LLM calls go through here
│   ├── friday-prompt.js             ← BOB + FRIDAY master system prompt and module prompts
│   ├── supabase.js                  ← Supabase server + browser clients
│   └── [others].js                  ← config, utils, data, etc.
│
├── middleware.js                    ← Protects all routes; allows /, /api/auth/*, /api/friday/voice
├── .env.example                     ← Template for env vars — copy to .env.local
└── .claude/CLAUDE.md                ← This file
```

## Patterns — follow these every time

### AI calls
- All calls to Claude go through `lib/brain.js → askFriday()`. Never call Anthropic SDK directly in a route.
- System prompt comes from `lib/friday-prompt.js`. Module-specific context uses `BOB_MODULE_PROMPT`, `AUTOPILOT_MODULE_PROMPT`, etc.

### API routes
- Every route that needs auth uses `isAuthorized()` from `lib/auth.js` (for API key check) — OR relies on the middleware session cookie.
- All routes return `NextResponse.json(...)`. Never `Response.json()` for consistency.
- Mark routes with `export const runtime = 'nodejs'` if they use Node APIs (crypto, fetch, etc.).

### Components
- All interactive components are `'use client'` at the top.
- Server components are default (no directive). Fetch data in server components, pass to client children.
- Dynamic imports with `{ ssr: false }` for any component using browser APIs (canvas, Web Speech, AudioContext).

### Auth flow
1. User hits any protected route → middleware checks `friday_session` cookie → if missing, redirect to `/`.
2. `/` renders `FridayApp` → `LockScreen` shown.
3. User speaks passphrase or types it → `LockScreen` POSTs to `/api/auth/login`.
4. Login route validates via `phraseMatches()` from `lib/session.js` → if OK, sets httpOnly cookie → returns `{ ok: true }`.
5. `LockScreen` calls `doUnlock()` → `FridayApp` transitions to `booting` → `BootSequence` → `ready`.
6. All subsequent requests pass middleware because cookie is present.

### Env vars
- Never hardcode secrets. All secrets in `.env.local` (gitignored).
- Server-only vars: bare name (e.g., `ANTHROPIC_API_KEY`).
- Client-accessible vars: `NEXT_PUBLIC_` prefix only (be careful — these are public).
- See `.env.example` for the full list.

## Ben's context (for BOB responses)
- Based in Hua Hin, Thailand (previously Melbourne, Australia).
- Was managing D2MS HelloFresh AU outbound floor (17 reps) — dismissed 10 April 2026.
- Building Fair Work unfair dismissal case while job hunting.
- Working on multiple AI projects: FRIDAY, BOB, D2MS Sales School, Harvest Clinic dashboard.
- BOB's personality: sharp, casual, dry Aussie humour, no corporate speak, short punchy answers, swears occasionally.

## What NOT to do
- Don't inline system prompts in route files — always import from `lib/friday-prompt.js`.
- Don't add Recharts or other charting libraries — use inline SVG (see Harvest dashboard pattern).
- Don't use arrow-function React components if targeting broad Babel compat (relevant for standalone HTML files only; Next.js is fine with modern syntax).
- Don't move or rename `middleware.js` — it must be at the project root (not inside `app/`).
- Don't add auth checks inside individual API routes for session-based auth — middleware handles it.
- Don't commit `.env.local` — it contains real API keys.
