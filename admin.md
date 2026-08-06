# Sarrows — Admin Panel API Documentation

Complete reference for every endpoint the admin panel uses. Intended for building the native Android admin interface.

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Base URL](#2-base-url)
3. [Common Conventions](#3-common-conventions)
4. [Movies](#4-movies)
   - 4.1 [List Movies (Admin)](#41-list-movies-admin)
   - 4.2 [Create Movie](#42-create-movie)
   - 4.3 [Update Movie](#43-update-movie)
   - 4.4 [Delete Movie](#44-delete-movie)
   - 4.5 [Get Single Movie (Admin)](#45-get-single-movie-admin)
   - 4.6 [List Movies (Public)](#46-list-movies-public)
5. [Anime / Series — Shared Admin Endpoints](#5-anime--series)
   - 5.1 [List All Series (Admin)](#51-list-all-series-admin)
   - 5.2 [Create Series](#52-create-series)
   - 5.3 [Update Series](#53-update-series)
   - 5.4 [Delete Series](#54-delete-series)
   - 5.5 [List Anime (Public)](#55-list-anime-public)
   - 5.6 [List Web Series (Public) ⭐ NEW](#56-list-web-series-public)
6. [Web Series — Admin Screen Reference ⭐ NEW](#6-web-series--admin-screen-reference)
   - 6.1 [List Web Series (Admin)](#61-list-web-series-admin)
   - 6.2 [Create Web Series](#62-create-web-series)
   - 6.3 [Update Web Series](#63-update-web-series)
   - 6.4 [Publish / Unpublish Web Series](#64-publish--unpublish-web-series)
   - 6.5 [Delete Web Series](#65-delete-web-series)
   - 6.6 [Search TMDB for TV Series](#66-search-tmdb-for-tv-series)
   - 6.7 [Fetch TMDB TV Metadata (Genres + Cast)](#67-fetch-tmdb-tv-metadata-genres--cast)
   - 6.8 [Add Episode to Web Series](#68-add-episode-to-web-series)
   - 6.9 [List Episodes for a Web Series](#69-list-episodes-for-a-web-series)
   - 6.10 [Update Episode](#610-update-episode)
   - 6.11 [Delete Episode](#611-delete-episode)
7. [Episodes — Shared Admin Endpoints](#7-episodes--shared-admin-endpoints)
   - 7.1 [Create Episode](#71-create-episode)
   - 7.2 [List Episodes for a Series](#72-list-episodes-for-a-series)
   - 7.3 [Update Episode](#73-update-episode)
   - 7.4 [Delete Episode](#74-delete-episode)
6. [Episodes](#6-episodes)
   - 6.1 [Create Episode](#61-create-episode)
   - 6.2 [List Episodes for a Series](#62-list-episodes-for-a-series)
   - 6.3 [Update Episode](#63-update-episode)
   - 6.4 [Delete Episode](#64-delete-episode)
8. [Genres](#8-genres)
   - 8.1 [List Genres](#81-list-genres)
   - 8.2 [Create Genre](#82-create-genre)
   - 8.3 [Delete Genre](#83-delete-genre)
9. [Users](#9-users)
   - 9.1 [List Users](#91-list-users)
   - 9.2 [Update User Role](#92-update-user-role)
10. [Content Requests](#10-content-requests)
    - 10.1 [List All Requests](#101-list-all-requests)
    - 10.2 [Update Request Status](#102-update-request-status)
    - 10.3 [Delete Request](#103-delete-request)
11. [TMDB Metadata (Movie & TV Autofill)](#11-tmdb-metadata-movie--tv-autofill)
    - 11.1 [Search TMDB](#111-search-tmdb)
    - 11.2 [Get TMDB Movie Details](#112-get-tmdb-movie-details)
    - 11.3 [Get TMDB TV Series Details ⭐ NEW](#113-get-tmdb-tv-series-details)
12. [AniList Metadata (Anime Autofill)](#12-anilist-metadata-anime-autofill)
    - 12.1 [Search AniList Anime](#121-search-anilist-anime)
    - 12.2 [Get Anime Characters (Cast)](#122-get-anime-characters-cast)
    - 12.3 [Get Episode Title](#123-get-episode-title)
13. [Data Models (Full Schemas)](#13-data-models-full-schemas)
14. [Error Reference](#14-error-reference)
15. [Admin Setup & Role Promotion](#15-admin-setup--role-promotion)

---

## 1. Authentication & Authorization

All admin endpoints require an active **NextAuth v5 JWT session** with `role === "admin"`. Every protected endpoint checks this server-side and returns `403 Forbidden` if the condition is not met.

### How authentication works

The app uses **credentials-only login** (email + password, no OAuth). On successful login NextAuth issues a JWT that is stored as a cookie. The JWT carries `{ id, role, name }` and the role is **re-synced from the database every 60 seconds** — so role changes propagate within one minute without requiring a re-login.

### Login endpoint

```
POST /api/auth/signin
```

This is handled by NextAuth internally. For the Android app use **cookie-based sessions** (NextAuth issues `next-auth.session-token`).

**Request body (JSON or form)**

| Field    | Type   | Required | Notes                  |
|----------|--------|----------|------------------------|
| email    | string | ✅        | Lowercased internally  |
| password | string | ✅        |                        |

**Security**
- After **10** consecutive failed attempts the account is locked for **15 minutes**.
- Locked accounts return no specific message — treat as invalid credentials.

### Signup endpoint

```
POST /api/auth/signup
```

**Request body**

| Field    | Type   | Required | Constraints                         |
|----------|--------|----------|-------------------------------------|
| nickname | string | ✅        | 3–20 chars, unique                  |
| email    | string | ✅        | Valid email, unique                 |
| password | string | ✅        | Min 8 chars (enforced by validator) |

**Response `201`**
```json
{ "user": { "id": "...", "nickname": "...", "email": "..." } }
```

### Session / "Who am I"

```
GET /api/me
```

Returns the currently authenticated user's profile and stats. No admin role required — any logged-in user can call this.

**Response `200`**
```json
{
  "user": {
    "id": "6849a1...",
    "nickname": "sarrows_admin",
    "email": "admin@example.com",
    "image": null,
    "role": "admin",
    "joinedAt": "2025-01-01T00:00:00.000Z"
  },
  "stats": {
    "watchedCount": 42,
    "watchlistCount": 7
  }
}
```

---

## 2. Base URL

| Environment    | Base URL                                        |
|----------------|-------------------------------------------------|
| Development    | `http://localhost:5000`                         |
| Replit preview | `https://<your-repl-slug>.replit.dev`           |
| Production     | Your deployed domain                            |

All paths below are relative to the base URL.

---

## 3. Common Conventions

### HTTP Methods

| Operation       | Method   |
|-----------------|----------|
| Read / List     | `GET`    |
| Create          | `POST`   |
| Partial update  | `PATCH`  |
| Delete          | `DELETE` |

### Headers (for every request)

```
Content-Type: application/json
Cookie: next-auth.session-token=<jwt>
```

On Android, use a `CookieJar` (e.g. OkHttp's `CookieManager`) so the session cookie is sent automatically on every request.

### IDs

All resource IDs are **MongoDB ObjectIds** — 24-character hex strings, e.g. `"6849a1c3f2e4b12d5e8f0123"`.

### Slug

Movies and Series both have a `slug` field (URL-safe, auto-generated from the title). You generally identify content by `_id` in admin operations and by `slug` in public-facing routes.

### Timestamps

All documents include `createdAt` and `updatedAt` ISO 8601 strings.

### Pagination (list endpoints)

Query params: `page` (default `1`), `limit` (default `24`, max `50`).

Response shape:
```json
{
  "data": [...],
  "total": 120,
  "page": 1,
  "totalPages": 5
}
```

---

## 4. Movies

### 4.1 List Movies (Admin)

```
GET /api/admin/movies
```

**Auth required:** admin

Returns **all** movies including drafts, with `videoUrl` and `videoType` included. Use this instead of `GET /api/movies` whenever you need draft content or the raw video URL in the admin panel.

**Query parameters**

| Param        | Type    | Default   | Notes                                                          |
|--------------|---------|-----------|----------------------------------------------------------------|
| page         | integer | `1`       |                                                                |
| limit        | integer | `24`      | Max `100`                                                      |
| sort         | string  | `latest`  | `latest` \| `oldest` \| `views` \| `rating` \| `year` \| `title` |
| status       | string  | —         | Filter by `"published"` or `"draft"` — omit to return all     |
| q            | string  | —         | Case-insensitive title search                                  |

**Response `200`**
```json
{
  "movies": [
    {
      "_id": "6849a1...",
      "title": "Inception",
      "slug": "inception",
      "status": "draft",
      "videoUrl": "https://cdn.example.com/inception.m3u8",
      "videoType": "hls",
      "posterUrl": "https://...",
      "releaseYear": 2010,
      "genres": [{ "_id": "...", "name": "Action" }],
      "rating": 8.8,
      "views": 0,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 42,
  "page": 1,
  "totalPages": 2
}
```

**Error responses**

| Status | Condition    |
|--------|--------------|
| 403    | Not admin    |
| 500    | Server error |

---

### 4.2 Create Movie

```
POST /api/admin/movies
```

**Auth required:** admin

**Request body**

| Field        | Type            | Required | Constraints                                      |
|--------------|-----------------|----------|--------------------------------------------------|
| title        | string          | ✅        | 1–200 chars                                      |
| description  | string          | ❌        | Max 2000 chars                                   |
| posterUrl    | string (URL)    | ❌        | Valid URL or empty string                        |
| bannerUrl    | string (URL)    | ❌        | Valid URL or empty string                        |
| trailerUrl   | string (URL)    | ❌        | Valid URL or empty string                        |
| videoUrl     | string (URL)    | ❌        | The actual CDN / stream link — valid URL or `""` |
| videoType    | string (enum)   | ❌        | `"auto"` \| `"hls"` \| `"direct"` \| `"embed"` — defaults to `"auto"` |
| externalId   | string          | ❌        | TMDB movie ID (for reference)                    |
| duration     | integer         | ❌        | Duration in **seconds** (positive)               |
| releaseYear  | integer         | ❌        | 1888 – current year + 5                          |
| genres       | string[]        | ❌        | Array of Genre ObjectIds                         |
| cast         | CastMember[]    | ❌        | See Cast Member Object below                     |
| status       | string (enum)   | ❌        | `"published"` \| `"draft"` — defaults `"draft"`  |
| rating       | number          | ❌        | 0–10                                             |

**Cast Member Object**

| Field     | Type         | Required | Constraints        |
|-----------|--------------|----------|--------------------|
| name      | string       | ✅        | 1–150 chars        |
| character | string       | ❌        | Max 150 chars      |
| image     | string (URL) | ❌        | Valid URL or `""`  |
| order     | integer      | ❌        | Sort order         |

**Response `201`**
```json
{
  "movie": {
    "_id": "6849a1...",
    "title": "Inception",
    "slug": "inception",
    "description": "A thief who steals...",
    "posterUrl": "https://...",
    "bannerUrl": "https://...",
    "trailerUrl": "https://...",
    "videoUrl": "https://cdn.example.com/inception.m3u8",
    "videoType": "hls",
    "externalId": "27205",
    "duration": 8880,
    "releaseYear": 2010,
    "genres": [{ "_id": "...", "name": "Action" }],
    "cast": [{ "name": "Leonardo DiCaprio", "character": "Cobb", "image": "https://...", "order": 0 }],
    "rating": 8.8,
    "ratingCount": 0,
    "views": 0,
    "status": "draft",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error responses**

| Status | Condition                          |
|--------|------------------------------------|
| 400    | Validation failure                 |
| 403    | Not admin                          |
| 409    | Movie with this title already exists |
| 500    | Server error                       |

> **Note on `videoType`:**  
> `"auto"` = sniff from URL extension (`.m3u8` → HLS, `.mp4` → direct).  
> Use `"hls"` / `"direct"` when the URL has no recognizable extension.  
> Use `"embed"` for iframe-based player links (e.g. YouTube embeds).

---

### 4.3 Update Movie

```
PATCH /api/movies/{id}
```

**Auth required:** admin

Same fields as Create, all **optional** (partial update). Only send the fields you want to change.

**Response `200`**
```json
{ "movie": { ...full movie object with videoUrl and videoType... } }
```

**Error responses**

| Status | Condition               |
|--------|-------------------------|
| 400    | Invalid ID or validation failure |
| 403    | Not admin               |
| 404    | Movie not found         |
| 500    | Server error            |

---

### 4.4 Delete Movie

```
DELETE /api/movies/{id}
```

**Auth required:** admin

**Response `200`**
```json
{ "success": true }
```

**Error responses**

| Status | Condition      |
|--------|----------------|
| 400    | Invalid ID     |
| 403    | Not admin      |
| 500    | Server error   |

---

### 4.5 Get Single Movie (Admin)

```
GET /api/movies/{id}
```

**Auth required:** admin (to receive `videoUrl` and `videoType` fields; non-admin gets them stripped)

**Notes:**
- Non-admin requests for `draft` movies get `404`.
- Admin requests always get the movie regardless of `status`, and the response includes `videoUrl` and `videoType`.

**Response `200`**
```json
{
  "movie": {
    "_id": "...",
    "title": "...",
    "videoUrl": "https://...",
    "videoType": "hls",
    "status": "draft",
    ...
  }
}
```

---

### 4.6 List Movies (Public)

```
GET /api/movies
```

**Auth required:** none (public endpoint, only returns `published` movies)

**Query parameters**

| Param  | Type    | Default   | Notes                                              |
|--------|---------|-----------|----------------------------------------------------|
| genre  | string  | —         | Genre name (case-insensitive)                      |
| year   | integer | —         | Filter by release year                             |
| sort   | string  | `latest`  | `latest` \| `views` \| `rating` \| `year`        |
| page   | integer | `1`       |                                                    |
| limit  | integer | `24`      | Max `50`                                           |

**Response `200`**
```json
{
  "movies": [ ...movie objects (no videoUrl)... ],
  "total": 48,
  "page": 1,
  "totalPages": 2
}
```

> **Admin note:** This public endpoint does not expose `videoUrl`. Use `GET /api/admin/movies` (§4.1) for the admin list which includes `videoUrl`, or fetch a single movie via `GET /api/movies/{id}` while authenticated as admin (§4.5).

---

## 5. Anime / Series

Movies and Anime/Series are separate MongoDB collections (`Movie` vs `Series`). The `Series` model is shared and differentiated by a `type` field:

| `type` value | Meaning | Web UI route | Admin tab |
|---|---|---|---|
| `"anime"` | Anime (sourced from AniList) | `/anime/[slug]` | Admin → Anime |
| `"series"` | Web series (sourced from TMDB TV) | `/series/[slug]` | Admin → Web Series |

Both types share the same admin CRUD endpoints (`/api/admin/series`), episode management, and review/watchlist/watch-history systems. Only the public-facing browse routes and metadata autofill sources differ.

### 5.1 List Anime / Series (Admin)

```
GET /api/admin/series
```

**Auth required:** admin

Returns **all** series/anime including drafts (`publishStatus: "draft"`). Use this instead of `GET /api/anime` in the admin panel.

**Query parameters**

| Param         | Type    | Default  | Notes                                                       |
|---------------|---------|----------|-------------------------------------------------------------|
| page          | integer | `1`      |                                                             |
| limit         | integer | `24`     | Max `100`                                                   |
| sort          | string  | `latest` | `latest` \| `oldest` \| `views` \| `rating` \| `title`    |
| type          | string  | —        | `"anime"` \| `"series"` — omit to return both              |
| publishStatus | string  | —        | `"published"` \| `"draft"` — omit to return all            |
| status        | string  | —        | `"ongoing"` \| `"completed"` — omit to return all          |
| q             | string  | —        | Case-insensitive title search                               |

**Response `200`**
```json
{
  "series": [
    {
      "_id": "6849a1...",
      "title": "Attack on Titan",
      "slug": "attack-on-titan",
      "type": "anime",
      "publishStatus": "draft",
      "status": "completed",
      "posterUrl": "https://...",
      "releaseYear": 2013,
      "genres": [{ "_id": "...", "name": "Action" }],
      "rating": 9.0,
      "views": 0,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 30,
  "page": 1,
  "totalPages": 2
}
```

**Error responses**

| Status | Condition    |
|--------|--------------|
| 403    | Not admin    |
| 500    | Server error |

---

### 5.2 Create Series

```
POST /api/admin/series
```

**Auth required:** admin

**Request body**

| Field         | Type          | Required | Constraints                                              |
|---------------|---------------|----------|----------------------------------------------------------|
| title         | string        | ✅        | 1–200 chars                                              |
| description   | string        | ❌        | Max 2000 chars                                           |
| posterUrl     | string (URL)  | ❌        | Valid URL or `""`                                        |
| bannerUrl     | string (URL)  | ❌        | Valid URL or `""`                                        |
| externalId    | string        | ❌        | AniList ID (from search `externalId`) or TMDB series ID |
| totalSeasons  | integer       | ❌        | Positive integer                                         |
| releaseYear   | integer       | ❌        | 1888 – current year + 5                                  |
| genres        | string[]      | ❌        | Array of Genre ObjectIds                                 |
| cast          | CastMember[]  | ❌        | Same shape as Movie cast                                 |
| status        | string (enum) | ❌        | `"ongoing"` \| `"completed"` — defaults `"ongoing"`     |
| type          | string (enum) | ❌        | `"anime"` \| `"series"` — defaults `"anime"`            |
| publishStatus | string (enum) | ❌        | `"published"` \| `"draft"` — defaults `"draft"`         |
| rating        | number        | ❌        | 0–10                                                     |

**Response `201`**
```json
{
  "series": {
    "_id": "...",
    "title": "Attack on Titan",
    "slug": "attack-on-titan",
    "description": "...",
    "posterUrl": "https://...",
    "bannerUrl": "https://...",
    "externalId": "16498",
    "totalSeasons": 4,
    "releaseYear": 2013,
    "genres": [{ "_id": "...", "name": "Action" }],
    "cast": [...],
    "status": "completed",
    "type": "anime",
    "publishStatus": "draft",
    "rating": 9.0,
    "ratingCount": 0,
    "views": 0,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Error responses**

| Status | Condition                           |
|--------|-------------------------------------|
| 400    | Validation failure                  |
| 403    | Not admin                           |
| 409    | Series with this title already exists |
| 500    | Server error                        |

---

### 5.3 Update Series

```
PATCH /api/admin/series/{id}
```

**Auth required:** admin

All fields optional (partial update). Same fields as Create.

**Response `200`**
```json
{ "series": { ...full series object... } }
```

**Error responses**

| Status | Condition               |
|--------|-------------------------|
| 400    | Invalid ID or validation |
| 403    | Not admin               |
| 404    | Series not found        |
| 500    | Server error            |

---

### 5.4 Delete Series

```
DELETE /api/admin/series/{id}
```

**Auth required:** admin

> ⚠️ This deletes the series document only. Episodes associated with the series are **not** automatically deleted. Delete episodes separately if needed.

**Response `200`**
```json
{ "success": true }
```

---

### 5.5 List Anime (Public)

```
GET /api/anime
```

**Auth required:** none (public; only returns `publishStatus: "published"`, `type: "anime"` by default)

**Query parameters**

| Param  | Type    | Default   | Notes                                         |
|--------|---------|-----------|-----------------------------------------------|
| type   | string  | `"anime"` | `"anime"` \| `"series"` — filter by content type |
| genre  | string  | —         | Genre name (case-insensitive)                 |
| status | string  | —         | `"ongoing"` \| `"completed"`                 |
| sort   | string  | `"latest"`| `"latest"` \| `"views"` \| `"rating"`       |
| page   | integer | `1`       |                                               |
| limit  | integer | `24`      | Max `50`                                      |

**Response `200`**
```json
{
  "series": [ ...series objects... ],
  "total": 30,
  "page": 1,
  "totalPages": 2
}
```

> **Note:** While this endpoint technically accepts `type=series`, prefer the dedicated `/api/series` endpoint (§5.6) for web series — it has a fixed `type:"series"` filter and a cleaner contract for native app use.

---

### 5.6 List Web Series (Public)

```
GET /api/series
```

**Auth required:** none (public; only returns `publishStatus: "published"`, always `type: "series"`)

This is the dedicated public endpoint for web series — the equivalent of `/api/anime` but fixed to `type:"series"`. Use this in your native app to populate the Web Series browse screen.

**Query parameters**

| Param  | Type    | Default   | Notes                                         |
|--------|---------|-----------|-----------------------------------------------|
| genre  | string  | —         | Genre name (case-insensitive)                 |
| status | string  | —         | `"ongoing"` \| `"completed"`                 |
| sort   | string  | `"latest"`| `"latest"` \| `"views"` \| `"rating"`       |
| page   | integer | `1`       |                                               |
| limit  | integer | `24`      | Max `50`                                      |

**Response `200`**
```json
{
  "series": [
    {
      "_id": "6849a1...",
      "title": "Breaking Bad",
      "slug": "breaking-bad",
      "type": "series",
      "publishStatus": "published",
      "status": "completed",
      "posterUrl": "https://image.tmdb.org/t/p/w500/...",
      "bannerUrl": "https://image.tmdb.org/t/p/original/...",
      "description": "A high school chemistry teacher...",
      "totalSeasons": 5,
      "releaseYear": 2008,
      "genres": [{ "_id": "...", "name": "Drama" }, { "_id": "...", "name": "Crime" }],
      "rating": 9.5,
      "ratingCount": 120,
      "views": 4200,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 12,
  "page": 1,
  "totalPages": 1
}
```

**Error responses**

| Status | Condition    |
|--------|--------------|
| 500    | Server error |

---

## 6. Episodes

Episodes belong to a Series. Each episode is uniquely identified within a series by `(series, season, episodeNumber)`.

### 6.1 Create Episode

```
POST /api/admin/episodes
```

**Auth required:** admin

**Request body**

| Field         | Type          | Required | Constraints                                              |
|---------------|---------------|----------|----------------------------------------------------------|
| series        | string        | ✅        | Series ObjectId                                          |
| season        | integer       | ❌        | Positive integer, defaults to `1`                        |
| episodeNumber | integer       | ✅        | Positive integer                                         |
| title         | string        | ❌        | Max 200 chars                                            |
| videoUrl      | string (URL)  | ❌        | Valid URL or `""`                                        |
| videoType     | string (enum) | ❌        | `"auto"` \| `"hls"` \| `"direct"` \| `"embed"`         |

**Response `201`**
```json
{
  "episode": {
    "_id": "...",
    "series": "6849a1...",
    "season": 1,
    "episodeNumber": 1,
    "title": "To You, in 2000 Years",
    "videoUrl": "https://cdn.example.com/aot-s01e01.m3u8",
    "videoType": "hls",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Error responses**

| Status | Condition                                        |
|--------|--------------------------------------------------|
| 400    | Validation failure                               |
| 403    | Not admin                                        |
| 409    | Episode number already exists for this season    |
| 500    | Server error                                     |

---

### 6.2 List Episodes for a Series

```
GET /api/admin/episodes?seriesId={seriesId}
```

**Auth required:** admin

Returns all episodes for a series, sorted by `season ASC, episodeNumber ASC`. Includes `videoUrl` and `videoType` (admin-only fields).

**Query parameters**

| Param    | Type   | Required | Notes           |
|----------|--------|----------|-----------------|
| seriesId | string | ✅        | Series ObjectId |

**Response `200`**
```json
{
  "episodes": [
    {
      "_id": "...",
      "series": "6849a1...",
      "season": 1,
      "episodeNumber": 1,
      "title": "To You, in 2000 Years",
      "videoUrl": "https://...",
      "videoType": "hls",
      "createdAt": "...",
      "updatedAt": "..."
    },
    ...
  ]
}
```

**Error responses**

| Status | Condition            |
|--------|----------------------|
| 400    | Missing or invalid seriesId |
| 403    | Not admin            |
| 500    | Server error         |

---

### 6.3 Update Episode

```
PATCH /api/admin/episodes/{id}
```

**Auth required:** admin

Partial update. All fields optional except `series` — the series an episode belongs to cannot be changed after creation.

**Editable fields**

| Field         | Type          | Notes                              |
|---------------|---------------|------------------------------------|
| season        | integer       |                                    |
| episodeNumber | integer       |                                    |
| title         | string        | Max 200 chars                      |
| videoUrl      | string (URL)  | Valid URL or `""`                  |
| videoType     | string (enum) | `"auto"` \| `"hls"` \| `"direct"` \| `"embed"` |

**Response `200`**
```json
{ "episode": { ...full episode object with videoUrl and videoType... } }
```

**Error responses**

| Status | Condition                                     |
|--------|-----------------------------------------------|
| 400    | Invalid episode ID or validation failure      |
| 403    | Not admin                                     |
| 404    | Episode not found                             |
| 409    | Episode number already exists for this season |
| 500    | Server error                                  |

---

### 6.4 Delete Episode

```
DELETE /api/admin/episodes/{id}
```

**Auth required:** admin

**Response `200`**
```json
{ "success": true }
```

**Error responses**

| Status | Condition         |
|--------|-------------------|
| 400    | Invalid episode ID |
| 403    | Not admin         |
| 404    | Episode not found |
| 500    | Server error      |

---

## 7. Genres

Genres are shared between Movies and Series. Genre names have **case-insensitive uniqueness** enforced at the database level.

### 7.1 List Genres

```
GET /api/admin/genres
```

**Auth required:** none (public)

Returns all genres sorted alphabetically.

**Response `200`**
```json
{
  "genres": [
    { "_id": "...", "name": "Action", "createdAt": "...", "updatedAt": "..." },
    { "_id": "...", "name": "Comedy", "createdAt": "...", "updatedAt": "..." }
  ]
}
```

---

### 7.2 Create Genre

```
POST /api/admin/genres
```

**Auth required:** admin

**Request body**

| Field | Type   | Required | Constraints       |
|-------|--------|----------|-------------------|
| name  | string | ✅        | Non-empty, trimmed |

**Idempotency:** If the genre already exists (case-insensitive), the existing genre is returned with status `200` instead of creating a duplicate. This makes it safe to use this endpoint in autofill flows without pre-checking.

**Response `201`** (new genre)
```json
{ "genre": { "_id": "...", "name": "Thriller", "createdAt": "...", "updatedAt": "..." } }
```

**Response `200`** (already exists)
```json
{ "genre": { "_id": "...", "name": "Thriller", "createdAt": "...", "updatedAt": "..." } }
```

**Error responses**

| Status | Condition         |
|--------|-------------------|
| 400    | Name is empty     |
| 403    | Not admin         |
| 500    | Server error      |

---

### 7.3 Delete Genre

```
DELETE /api/admin/genres/{id}
```

**Auth required:** admin

> ⚠️ Deleting a genre does not remove it from existing movies/series. Those documents will still have the ObjectId in their `genres` array but it will no longer resolve to a name.

**Response `200`**
```json
{ "success": true }
```

---

## 8. Users

### 8.1 List Users

```
GET /api/admin/users
```

**Auth required:** admin

Returns a paginated list of all users, newest first. Supports filtering by role and searching by nickname or email.

**Query parameters**

| Param | Type    | Default | Notes                                            |
|-------|---------|---------|--------------------------------------------------|
| page  | integer | `1`     |                                                  |
| limit | integer | `50`    | Max `100`                                        |
| role  | string  | —       | Filter by role: `"user"` \| `"admin"`            |
| q     | string  | —       | Search nickname or email (case-insensitive regex) |

**Response `200`**
```json
{
  "users": [
    {
      "_id": "6849a1...",
      "nickname": "john_doe",
      "email": "john@example.com",
      "image": null,
      "role": "user",
      "loginAttempts": 0,
      "lockedUntil": null,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 84,
  "page": 1,
  "totalPages": 2
}
```

**Notes:**
- `passwordHash` is never returned.
- `lockedUntil` is non-null when the account is currently locked due to too many failed login attempts. Lock expires automatically after 15 minutes.
- `loginAttempts` resets to `0` on successful login.

**Error responses**

| Status | Condition |
|--------|-----------|
| 403    | Not admin |
| 500    | Server error |

---

### 8.2 Update User Role

```
PATCH /api/admin/users/{id}
```

**Auth required:** admin

Only the `role` field can be updated via this endpoint.

**Request body**

| Field | Type          | Required | Constraints              |
|-------|---------------|----------|--------------------------|
| role  | string (enum) | ✅        | `"user"` \| `"admin"`   |

**Response `200`**
```json
{
  "user": {
    "_id": "...",
    "nickname": "john_doe",
    "email": "john@example.com",
    "image": null,
    "role": "admin",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Error responses**

| Status | Condition                        |
|--------|----------------------------------|
| 400    | Invalid ID or invalid role value |
| 403    | Not admin                        |
| 404    | User not found                   |
| 500    | Server error                     |

---

## 9. Content Requests

Users can submit requests for new content (movies, series, anime) to be added to the platform. Admins can view, update the status, and delete requests.

### 9.1 List All Requests

```
GET /api/admin/requests
```

**Auth required:** admin

Returns all requests sorted by `createdAt DESC` (newest first), with user info populated.

**Response `200`**
```json
{
  "requests": [
    {
      "_id": "...",
      "user": { "_id": "...", "nickname": "john_doe", "email": "john@example.com" },
      "title": "Interstellar",
      "type": "movie",
      "note": "Please add this classic!",
      "status": "pending",
      "adminNote": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**Request statuses**

| Status      | Meaning                                |
|-------------|----------------------------------------|
| `pending`   | Not yet reviewed                       |
| `in_progress` | Admin is working on adding it        |
| `fulfilled` | Content has been added to the platform |
| `rejected`  | Request declined                       |

---

### 9.2 Update Request Status

```
PATCH /api/admin/requests/{id}
```

**Auth required:** admin

**Request body**

| Field     | Type          | Required | Constraints                                                              |
|-----------|---------------|----------|--------------------------------------------------------------------------|
| status    | string (enum) | ✅        | `"pending"` \| `"in_progress"` \| `"fulfilled"` \| `"rejected"`        |
| adminNote | string        | ❌        | Max 500 chars — visible feedback to the user about why it was rejected, etc. |

**Response `200`**
```json
{
  "request": {
    "_id": "...",
    "user": { "_id": "...", "nickname": "john_doe", "email": "john@example.com" },
    "title": "Interstellar",
    "type": "movie",
    "note": "Please add this!",
    "status": "fulfilled",
    "adminNote": "Added! Check the movies section.",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### 9.3 Delete Request

```
DELETE /api/admin/requests/{id}
```

**Auth required:** admin

**Response `200`**
```json
{ "success": true }
```

**Error responses**

| Status | Condition             |
|--------|-----------------------|
| 400    | Invalid request ID    |
| 403    | Not admin             |
| 404    | Request not found     |
| 500    | Server error          |

---

## 10. TMDB Metadata (Movie & TV Autofill)

These endpoints proxy the TMDB API (The Movie Database) to auto-fill movie and web series details when creating or editing content. **Requires `TMDB_API_KEY` to be set server-side.** If the key is missing all results come back empty — the endpoints don't error, they just return no data.

### 10.1 Search TMDB

```
GET /api/admin/tmdb/search?q={query}&type={type}
```

**Auth required:** admin

**Query parameters**

| Param | Type   | Required | Default   | Notes                    |
|-------|--------|----------|-----------|--------------------------|
| q     | string | ✅        | —         | Search term              |
| type  | string | ❌        | `"movie"` | `"movie"` \| `"tv"`     |

Returns up to **10** results.

**Response `200`**
```json
{
  "results": [
    {
      "externalId": "27205",
      "title": "Inception",
      "description": "A thief who steals corporate secrets...",
      "posterUrl": "https://image.tmdb.org/t/p/w500/...",
      "bannerUrl": "https://image.tmdb.org/t/p/original/...",
      "releaseYear": 2010,
      "rating": 8.8
    }
  ]
}
```

> Use `externalId` to then call the detail endpoint for full metadata (duration, genres, cast).

---

### 10.2 Get TMDB Movie Details

```
GET /api/admin/tmdb/movie/{tmdbId}
```

**Auth required:** admin

`{tmdbId}` is the numeric TMDB movie ID (the `externalId` from search results).

Fetches **runtime, genre names, cast, and trailer URL** — the fields not available in search results.

**Response `200`**
```json
{
  "duration": 8880,
  "genreNames": ["Action", "Science Fiction", "Adventure"],
  "trailerUrl": "https://www.youtube.com/watch?v=YoHD9XEInc0",
  "cast": [
    {
      "name": "Leonardo DiCaprio",
      "character": "Cobb",
      "image": "https://image.tmdb.org/t/p/w500/...",
      "order": 0
    },
    {
      "name": "Joseph Gordon-Levitt",
      "character": "Arthur",
      "image": "https://image.tmdb.org/t/p/w500/...",
      "order": 1
    }
  ]
}
```

**Notes:**
- `duration` is in **seconds**.
- `genreNames` are plain strings — you must resolve or create Genre documents from them before assigning to a movie (use `POST /api/admin/genres` for each, which is idempotent).
- Cast is capped at **15 members** sorted by billing order.
- `trailerUrl` is a YouTube watch URL (`https://www.youtube.com/watch?v=...`). Prefers the official trailer; falls back to any YouTube trailer. `null` if TMDB has no YouTube trailer for the movie.

**Error responses**

| Status | Condition                    |
|--------|------------------------------|
| 400    | Missing TMDB ID              |
| 403    | Not admin                    |
| 404    | TMDB movie not found         |
| 500    | Server error / TMDB API down |

---

### 10.3 Get TMDB TV Series Details

```
GET /api/admin/tmdb/tv/{tmdbId}
```

**Auth required:** admin

`{tmdbId}` is the numeric TMDB TV series ID — the `externalId` returned from `GET /api/admin/tmdb/search?type=tv&q=...`.

Fetches **genre names, cast, and trailer URL** for a TV series in a single call. This is the equivalent of §10.2 for web series. Call this immediately after the user selects a result from the TV search to populate genres, cast, and trailer.

**Response `200`**
```json
{
  "genreNames": ["Drama", "Crime", "Thriller"],
  "trailerUrl": "https://www.youtube.com/watch?v=HhesaQXLuRY",
  "cast": [
    {
      "name": "Bryan Cranston",
      "character": "Walter White",
      "image": "https://image.tmdb.org/t/p/w500/...",
      "order": 0
    },
    {
      "name": "Aaron Paul",
      "character": "Jesse Pinkman",
      "image": "https://image.tmdb.org/t/p/w500/...",
      "order": 1
    }
  ]
}
```

**Notes:**
- `genreNames` are plain strings — resolve each to a Genre ObjectId via `POST /api/admin/genres` (idempotent) before saving the series.
- Cast is capped at **15 members** sorted by billing order.
- Unlike the movie equivalent, there is no `duration` field — TV series don't have a single runtime.
- `trailerUrl` is a YouTube watch URL (`https://www.youtube.com/watch?v=...`). Prefers the official trailer; falls back to any YouTube trailer. `null` if TMDB has no YouTube trailer for the series.
- The endpoint makes three TMDB requests in parallel (`/tv/{id}` for genres + `/tv/{id}/credits` for cast + `/tv/{id}/videos` for trailer).

**Error responses**

| Status | Condition                      |
|--------|--------------------------------|
| 400    | Missing TMDB ID                |
| 403    | Not admin                      |
| 404    | TMDB TV series not found       |
| 500    | Server error / TMDB API down   |

---

## 11. AniList Metadata (Anime Autofill)

AniList is a free, open GraphQL API — **no API key required**. It replaces Jikan (which has been discontinued) as the source for anime metadata. Rate limit: **90 requests per minute**.

> **Important — ID format change:** AniList uses its own numeric IDs, which are **different from MyAnimeList (MAL) IDs**. The `externalId` stored on a Series document is now an AniList ID. Do not pass MAL IDs to these endpoints.

### Hybrid trailer strategy for anime

AniList does not expose trailer data. To fill `trailerUrl` for anime, the admin form performs an **additional TMDB lookup using the anime title** after the AniList result is selected:

1. `GET /api/admin/tmdb/search?q={animeTitle}&type=tv` → take the first result's `externalId` (TMDB TV ID)
2. `GET /api/admin/tmdb/tv/{tmdbId}` → read only `trailerUrl` from the response; ignore `genreNames` and `cast` (those come from AniList)

This is a **best-effort** lookup — TMDB may not always return a match for every anime title. If no match is found, `trailerUrl` stays blank and can be pasted manually. All other metadata (title, description, poster, banner, rating, genres, cast) is sourced exclusively from AniList.

**Canonical routes** (use these in new integrations):
```
/api/admin/anilist/search
/api/admin/anilist/anime/{anilistId}/characters
/api/admin/anilist/anime/{anilistId}/episodes/{episodeNumber}
```

**Legacy routes** (still work, now powered by AniList under the hood):
```
/api/admin/jikan/search
/api/admin/jikan/anime/{id}/characters
/api/admin/jikan/anime/{id}/episodes/{ep}
```

---

### 11.1 Search AniList Anime

```
GET /api/admin/anilist/search?q={query}
```

**Auth required:** admin

Returns up to **10** results sorted by popularity.

**Query parameters**

| Param | Type   | Required | Notes       |
|-------|--------|----------|-------------|
| q     | string | ✅        | Search term |

**Response `200`**
```json
{
  "results": [
    {
      "externalId": "16498",
      "title": "Attack on Titan",
      "description": "Humanity lives inside cities surrounded by enormous walls...",
      "posterUrl": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/...",
      "bannerUrl": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/...",
      "releaseYear": 2013,
      "rating": 8.7,
      "episodes": 25,
      "genreNames": ["Action", "Drama", "Fantasy"]
    }
  ]
}
```

**Differences from old Jikan response:**
- `externalId` is now an **AniList ID**, not a MAL ID
- `bannerUrl` is a real separate banner image when available (AniList has proper banners)
- `rating` is on a **0–10 scale** (AniList scores 0–100, normalised by dividing by 10)
- Descriptions have HTML stripped and entities decoded

---

### 11.2 Get Anime Characters (Cast)

```
GET /api/admin/anilist/anime/{anilistId}/characters
```

**Auth required:** admin

`{anilistId}` is the AniList numeric ID from the search `externalId` field.

Returns up to **15 main cast members**, sorted by role relevance. The `name` field is the Japanese voice actor; `character` is the character they voice.

**Path parameters**

| Param     | Type    | Required | Notes                           |
|-----------|---------|----------|---------------------------------|
| anilistId | integer | ✅        | AniList numeric ID (digits only) |

**Response `200`**
```json
{
  "cast": [
    {
      "name": "Kaji Yuki",
      "character": "Yeager Eren",
      "image": "https://s4.anilist.co/file/anilistcdn/staff/medium/...",
      "order": 0
    },
    {
      "name": "Inoue Marina",
      "character": "Ackerman Mikasa",
      "image": "https://s4.anilist.co/file/anilistcdn/staff/medium/...",
      "order": 1
    }
  ]
}
```

**Error responses**

| Status | Condition                                      |
|--------|------------------------------------------------|
| 400    | Invalid or non-numeric AniList ID              |
| 403    | Not admin                                      |
| 500    | Server error                                   |

---

### 11.3 Get Episode Title

```
GET /api/admin/anilist/anime/{anilistId}/episodes/{episodeNumber}
```

**Auth required:** admin

> **Note:** AniList does not expose per-episode titles through its public API. This endpoint **always returns `{ "title": null }`**. Enter episode titles manually when adding episodes, or leave the field blank.

**Response `200`**
```json
{
  "title": null,
  "note": "AniList does not expose per-episode titles — enter manually."
}
```

**Error responses**

| Status | Condition                          |
|--------|------------------------------------|
| 400    | Invalid AniList ID or episode number |
| 403    | Not admin                          |
| 500    | Server error                       |

---

## 12. Data Models (Full Schemas)

### Movie

| Field        | Type          | Notes                                                         |
|--------------|---------------|---------------------------------------------------------------|
| `_id`        | ObjectId      | Auto-generated                                                |
| `title`      | string        | Required                                                      |
| `slug`       | string        | Auto-generated from title, unique                             |
| `description`| string        |                                                               |
| `posterUrl`  | string        |                                                               |
| `bannerUrl`  | string        |                                                               |
| `trailerUrl` | string        |                                                               |
| `videoUrl`   | string        | **Hidden by default** — only returned when admin is logged in |
| `videoType`  | enum          | `auto` \| `hls` \| `direct` \| `embed` — hidden by default   |
| `externalId` | string        | TMDB movie ID                                                 |
| `duration`   | number        | In seconds                                                    |
| `releaseYear`| number        |                                                               |
| `genres`     | ObjectId[]    | Refs to Genre                                                 |
| `cast`       | CastMember[]  |                                                               |
| `rating`     | number        | Aggregated average (0–10)                                     |
| `ratingCount`| number        | Number of ratings                                             |
| `views`      | number        |                                                               |
| `status`     | enum          | `published` \| `draft`                                        |
| `createdAt`  | Date          |                                                               |
| `updatedAt`  | Date          |                                                               |

### Series (Anime / TV Series)

| Field          | Type          | Notes                                                    |
|----------------|---------------|----------------------------------------------------------|
| `_id`          | ObjectId      |                                                          |
| `title`        | string        | Required                                                 |
| `slug`         | string        | Auto-generated, unique                                   |
| `description`  | string        |                                                          |
| `posterUrl`    | string        |                                                          |
| `bannerUrl`    | string        |                                                          |
| `trailerUrl`   | string        | YouTube watch URL — auto-filled from TMDB for web series and anime (best-effort); manual for anime fallback |
| `externalId`   | string        | AniList ID or TMDB TV ID                                 |
| `totalSeasons` | number        |                                                          |
| `releaseYear`  | number        |                                                          |
| `genres`       | ObjectId[]    | Refs to Genre                                            |
| `cast`         | CastMember[]  |                                                          |
| `status`       | enum          | `ongoing` \| `completed`                                 |
| `type`         | enum          | `anime` \| `series`                                      |
| `publishStatus`| enum          | `published` \| `draft`                                   |
| `rating`       | number        | Aggregated average (0–10)                                |
| `ratingCount`  | number        |                                                          |
| `views`        | number        |                                                          |
| `createdAt`    | Date          |                                                          |
| `updatedAt`    | Date          |                                                          |

> **Difference in status fields:** Movies have a single `status` field (`published`/`draft`). Series have `publishStatus` (`published`/`draft`) AND `status` (`ongoing`/`completed`) — they mean different things.

### Episode

| Field           | Type     | Notes                                                     |
|-----------------|----------|-----------------------------------------------------------|
| `_id`           | ObjectId |                                                           |
| `series`        | ObjectId | Ref to Series — **cannot be changed after creation**      |
| `season`        | number   | Default `1`                                               |
| `episodeNumber` | number   | Required; unique per `(series, season)`                   |
| `title`         | string   |                                                           |
| `videoUrl`      | string   | Hidden by default — only returned via admin endpoints     |
| `videoType`     | enum     | `auto` \| `hls` \| `direct` \| `embed` — hidden by default |
| `createdAt`     | Date     |                                                           |
| `updatedAt`     | Date     |                                                           |

### Genre

| Field       | Type   | Notes                            |
|-------------|--------|----------------------------------|
| `_id`       | ObjectId |                                |
| `name`      | string | Required, case-insensitively unique |
| `createdAt` | Date   |                                  |
| `updatedAt` | Date   |                                  |

### User

| Field           | Type   | Notes                                                      |
|-----------------|--------|------------------------------------------------------------|
| `_id`           | ObjectId |                                                          |
| `nickname`      | string | 3–20 chars, unique                                         |
| `email`         | string | Unique, lowercased                                         |
| `passwordHash`  | string | Never returned by any endpoint                             |
| `image`         | string | Avatar URL                                                 |
| `role`          | enum   | `user` \| `admin`                                         |
| `emailVerified` | Date   |                                                            |
| `loginAttempts` | number | Incremented on failed login; reset on success              |
| `lockedUntil`   | Date   | Account locked until this time after 10 failed attempts    |
| `createdAt`     | Date   |                                                            |
| `updatedAt`     | Date   |                                                            |

### Content Request

| Field       | Type     | Notes                                                                   |
|-------------|----------|-------------------------------------------------------------------------|
| `_id`       | ObjectId |                                                                         |
| `user`      | ObjectId | Ref to User — populated as `{ _id, nickname, email }` in admin endpoint |
| `title`     | string   | Requested content title, max 200 chars                                  |
| `type`      | enum     | `movie` \| `series` \| `anime`                                         |
| `note`      | string   | User note, max 500 chars                                                |
| `status`    | enum     | `pending` \| `in_progress` \| `fulfilled` \| `rejected`                |
| `adminNote` | string   | Admin feedback, max 500 chars                                           |
| `createdAt` | Date     |                                                                         |
| `updatedAt` | Date     |                                                                         |

### Cast Member (embedded sub-document)

| Field       | Type    | Notes                    |
|-------------|---------|--------------------------|
| `name`      | string  | Required, max 150 chars  |
| `character` | string  | Max 150 chars            |
| `image`     | string  | URL to actor/VA photo    |
| `order`     | integer | Billing order (0 = top)  |

---

## 13. Error Reference

All error responses share the same shape:

```json
{ "error": "Human-readable message" }
```

| Status | Meaning                                                              |
|--------|----------------------------------------------------------------------|
| 400    | Bad request — invalid ID format or validation error in request body  |
| 401    | Unauthorized — no valid session                                      |
| 403    | Forbidden — logged in but not admin                                  |
| 404    | Resource not found (or draft content accessed without admin session) |
| 409    | Conflict — duplicate title or episode number                         |
| 500    | Internal server error                                                |

---

## 14. Admin Setup & Role Promotion

New accounts always start with `role: "user"`. To promote an account to admin:

**Option A — MongoDB shell (first admin)**
```js
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

**Option B — Admin panel (once you have one admin)**
Call `PATCH /api/admin/users/{id}` with `{ "role": "admin" }`.

**Option C — Admin → Users panel in the web app**
Use the user management UI which calls the same PATCH endpoint.

---

## Recommended Android Admin Workflow

Here is the typical flow for common admin tasks.

### Adding a Movie
1. `GET /api/admin/genres` → load genre list for the picker
2. `GET /api/admin/tmdb/search?q=Inception&type=movie` → let user pick from results
3. `GET /api/admin/tmdb/movie/27205` → autofill `duration`, `genreNames`, `cast`, and `trailerUrl` (YouTube)
   - `videoUrl` is also auto-constructed client-side as `https://vidnest.fun/movie/{tmdbId}` with `videoType: "embed"` — no extra API call needed
4. `POST /api/admin/genres` for each genre name (idempotent) → get their ObjectIds
5. `POST /api/admin/movies` with full payload → movie created in `draft` status
6. When ready to go live: `PATCH /api/movies/{id}` with `{ "status": "published" }`

### Adding a Web Series + Episodes
1. `GET /api/admin/genres` → genre picker
2. `GET /api/admin/tmdb/search?q=Breaking+Bad&type=tv` → user picks from up to 10 results; note the `externalId` (TMDB TV ID)
3. `GET /api/admin/tmdb/tv/{tmdbId}` → autofill `genreNames`, `cast`, and `trailerUrl` (YouTube) in a single call
4. `POST /api/admin/genres` for each genre name (idempotent) → get ObjectIds
5. `POST /api/admin/series` with full payload and **`"type": "series"`** → series created in `draft` state
   ```json
   {
     "title": "Breaking Bad",
     "type": "series",
     "externalId": "1396",
     "totalSeasons": 5,
     "releaseYear": 2008,
     "genres": ["<genreObjectId1>", "<genreObjectId2>"],
     "cast": [...],
     "publishStatus": "draft",
     "status": "completed"
   }
   ```
6. For each episode: `POST /api/admin/episodes` with `{ "series": "<seriesId>", "season": 1, "episodeNumber": 1, "title": "...", "videoUrl": "...", "videoType": "hls" }`
7. `PATCH /api/admin/series/{id}` with `{ "publishStatus": "published" }` when ready

> **Key difference from Anime:** Web series use `type: "series"` and TMDB (`/api/admin/tmdb/...`) for metadata. Anime use `type: "anime"` and AniList (`/api/admin/anilist/...`) for metadata. Episode management and the episode schema are identical for both.

### Adding Anime + Episodes
1. `GET /api/admin/genres` → genre picker
2. `GET /api/admin/anilist/search?q=Attack+on+Titan` → pick anime, note the `externalId` (AniList ID)
3. In parallel, fire all three of these:
   - `GET /api/admin/anilist/anime/16498/characters` → autofill cast (use AniList ID, not MAL ID)
   - `GET /api/admin/tmdb/search?q=Attack+on+Titan&type=tv` → get first result's TMDB TV ID
   - `GET /api/admin/tmdb/tv/{tmdbId}` → read only `trailerUrl`; discard genres and cast
4. `POST /api/admin/genres` for each genre name from AniList (idempotent) → get ObjectIds
5. `POST /api/admin/series` with full payload and **`"type": "anime"`** → anime created in `draft` state
6. For each episode: `POST /api/admin/episodes` — episode titles must be entered manually (AniList does not expose them)
7. `PATCH /api/admin/series/{id}` with `{ "publishStatus": "published" }` when ready

> **Trailer note:** Step 3's TMDB lookup is best-effort. If TMDB returns no match for the anime title, omit `trailerUrl` from the payload or let the admin paste it manually.

### Handling Content Requests
1. `GET /api/admin/requests` → list with user info
2. `PATCH /api/admin/requests/{id}` with `{ "status": "in_progress" }` → acknowledge
3. Add the content (see above flows)
4. `PATCH /api/admin/requests/{id}` with `{ "status": "fulfilled", "adminNote": "Added!" }`

---

## Public Browsing Routes (for native app deep links)

| Content type | List page  | Detail page          | Episode player                        |
|---|---|---|---|
| Movies       | `/movies`  | `/movies/[slug]`     | N/A                                   |
| Anime        | `/anime`   | `/anime/[slug]`      | `/anime/[slug]/episode/[epId]`        |
| Web Series   | `/series`  | `/series/[slug]`     | `/series/[slug]/episode/[epId]`       |

> All detail and episode pages require the user to be logged in. Unauthenticated users are redirected to `/login`.  
> Episode `[epId]` is the MongoDB `_id` of the Episode document, returned by `GET /api/episodes?seriesId={id}` or `GET /api/admin/episodes?seriesId={id}`.
