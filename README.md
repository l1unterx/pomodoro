# Pomodoro

A minimalist, single-page Pomodoro timer with accounts, persistent server-side
timers, statistics, and a leaderboard.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · MongoDB

## Getting started

```bash
npm install
npm run dev
```

Requires a running MongoDB instance. Set the connection string in `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/pomodoro
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint

## How it works

- **Auth**: username/password, bcrypt-hashed, session cookie backed by a
  Mongo-stored token (`lib/auth.ts`).
- **Timer**: server-persisted (`activeTimers` collection) — `startedAt`/`endsAt`
  timestamps are the source of truth, resolved lazily on read
  (`lib/timer.ts`). No server-side interval; the browser only displays a
  countdown while the page is open, and a completed work session is recorded
  to `pomodoroSessions` the next time state is resolved (page load or an
  in-tab sync), even if that happens well after the timer actually finished.
- **Stats & leaderboard**: computed on read via MongoDB aggregation
  (`lib/stats.ts`) — no denormalized counters to keep in sync.
- **Export/Import**: session history as `.xlsx` (`lib/actions/data.ts`).

## Project structure

```
app/                  the single "/" route + layout
components/           UI components
hooks/useTimer.ts     client-side timer state/sync logic
lib/actions/          server actions (auth, timer, stats, data)
lib/                  auth, db connection, business logic, types, validation
```
