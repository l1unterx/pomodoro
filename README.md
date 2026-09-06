# Pomodoro

A minimalist, single-page Pomodoro timer with accounts, persistent server-side
timers, statistics, and a leaderboard.

## Features

- Username/password auth (bcrypt-hashed, session cookies)
- Work/break timer with presets and custom durations, backed by a
  server-persisted timer so it survives closing the browser
- Sound + browser notifications on work/break completion
- Session history, statistics (average, standard deviation), and a chart with
  weekly/monthly/yearly views
- Leaderboard by total completed work time
- Export/import session history as Excel (`.xlsx`)

## Getting started

1. Make sure MongoDB is running and reachable at the URI in `.env`
   (defaults to `mongodb://localhost:27017/pomodoro`).
2. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `app/page.tsx` — the single route; renders the auth panel or the app
- `components/` — UI components (client components only where interactivity
  is required)
- `hooks/` — client-side stateful logic (the timer's sync/countdown machinery)
- `lib/actions/` — server actions (auth, timer, stats, export/import)
- `lib/` — database connection, auth, timer resolution, stats queries,
  validation, types, and small browser-API utilities (sound, notifications)

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint
```
