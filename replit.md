# Sarrows — Movie & Anime Streaming Platform

## Project Overview
Sarrows is a full-featured movie and anime streaming platform built with Next.js 15 (App Router), TypeScript, MongoDB Atlas, and Tailwind CSS.

## Tech Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Database:** MongoDB Atlas + Mongoose ODM
- **Auth:** NextAuth v5 (credentials only — email + password)
- **Styling:** Tailwind CSS (custom dark theme)
- **Video:** hls.js custom VideoPlayer (HLS .m3u8 or direct .mp4 CDN links) or inframe links 
- **Search:** MongoDB regex/text index search

## Key Features
- Movie & Anime streaming with custom HLS video player
- Browse/filter by genre, year, sort order
- Full auth (signup/login) with bcrypt password hashing
- Watchlist & watch history with resume playback
- Reviews & ratings (1–10) per movie/series
- Admin panel: CRUD for movies, anime, episodes, genres, users
- TMDB metadata auto-fill in admin forms
- Responsive dark-themed UI

## Directory Structure
- `src/app/(marketing)/` — Landing page (no navbar)
- `src/app/(auth)/` — Login/Signup pages
- `src/app/(main)/` — Main app with Navbar/Footer (home, movies, anime, search, watchlist, profile)
- `src/app/admin/` — Role-gated admin panel
- `src/app/api/` — All API routes (auth, movies, anime, episodes, watchlist, reviews, watch-history, search, admin CRUD)
- `src/components/` — All React components
- `src/models/` — Mongoose models (User, Movie, Series, Episode, Genre, Review, WatchHistory, Watchlist)
- `src/lib/` — DB connection, auth config, validators, utils, external API wrapper

## Environment Variables Required
- `MONGODB_URI` — MongoDB Atlas connection string
- `NEXTAUTH_SECRET` / `AUTH_SECRET` — JWT signing secret
- `NEXTAUTH_URL` / `AUTH_URL` — Base URL (http://localhost:5000 in dev)
- `AUTH_TRUST_HOST` — required by NextAuth v5 behind Replit's proxy
- `TMDB_API_KEY` — Optional, for TMDB metadata auto-fill in admin

All of the above are already provided in `.env.local` in this environment.

## Running Locally
```bash
npm run dev  # starts on port 5000
```

## Admin Setup
After signup, make yourself admin by updating your user document in MongoDB:
```
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```
Or use the Admin → Users panel once you have admin access.

## User Preferences
- Port: 5000 (required for Replit webview)
- Dark theme throughout — no light mode
- CDN video URLs stored directly (no upload pipeline needed)
