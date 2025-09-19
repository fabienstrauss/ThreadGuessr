# ThreadGuessr

A Reddit guessing game built on Devvit. Players guess which subreddit a post came from across 10 daily rounds, with streak multipliers, partial credit, and weekly leaderboards.

## How It Works

**Daily Challenge:** Everyone plays the same 10 posts each day
- Rounds 1-5: Easy difficulty (any subreddit guess allowed)
- Rounds 6-10: Hard difficulty (must choose from curated whitelist)

**Scoring System:**
- Correct answer: 10 points × streak multiplier (1.0, 1.1, 1.2...)
- Partial credit (maintains streak):
  - Same category: 6 points
  - Shared tags: 3 points
- Wrong answer: 0 points, streak resets

**Competition:** Weekly leaderboard tracks your best daily scores

## Getting Started

**Requirements:**
- Node.js 22+
- Devvit CLI: `npm i -g devvit`
- Reddit developer account (logged into Devvit CLI)
- Test subreddit for development

**Setup:**
```bash
npm install
npm run login    # Authenticate with Reddit
npm run dev      # Start development server
```

**Key Commands:**
- `npm run dev` — Development server with live reload
- `npm run build` — Build for production
- `npm run deploy` — Upload to Devvit
- `npm run launch` — Build, deploy, and submit for review

## Tech Stack

- **Platform:** Devvit (Reddit's app platform)
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Express.js + TypeScript
- **Database:** Redis (via Devvit APIs)
- **Architecture:** Shared types across client/server

## For Moderators

**Creating Games:** Use the Devvit menu in your subreddit: `Menu → Create a new post`

**Content Moderation:** Players can report inappropriate content through the in-game interface

## Development

**Project Structure:**
```
src/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # TypeScript types
└── data/           # Content files
```

**Content Management:**
- `src/data/whitelist.json` — Allowed subreddits with categories/tags
- `src/data/seeds.json` — Curated posts for the game
- Development tools available at `/internal/dev/` endpoints

**Configuration:**
- Edit `devvit.json` to set your test subreddit
- Use `.env` for environment variables

## API Reference

**Game Endpoints:**
- `GET /api/daily-status` — Check if user can play today
- `GET /api/round?roundIndex=<0-9>` — Get round data
- `POST /api/guess` — Submit answer
- `GET /api/leaderboard` — Weekly rankings
- `GET /api/stats` — User's daily statistics

**Admin Endpoints:** Available under `/internal/*`

## Deployment

1. **Build:** `npm run build`
2. **Upload:** `npm run deploy`
3. **Publish:** `npm run launch` (includes review submission)

Configure app details in the Devvit Developer Portal before publishing.

## License & Contributing

**License:** BSD-3-Clause

**Contributing:** Issues and PRs welcome. Please include testing notes and keep changes focused.
