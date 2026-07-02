# GitHub Profile Analyzer API

A production-ready backend REST API that analyzes public GitHub profiles — fetching user and repository data from the GitHub Public REST API, computing useful statistics (total stars, most-used language, average stars/forks, etc.), and persisting the results in a MySQL database.

Built with **Node.js**, **Express.js**, and **MySQL**, following the MVC architectural pattern.

---

## Table of Contents

- [Features](#features)
- [Folder Structure](#folder-structure)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Project](#running-the-project)
- [API Endpoints](#api-endpoints)
- [Sample Requests & Responses](#sample-requests--responses)
- [Postman Collection](#postman-collection)

---

## Features

- **Analyze any public GitHub profile** — fetches profile + all repositories, computes insights, and stores/updates the record in MySQL (upsert, no duplicates).
- **Repository insights**: total repos, total stars, total forks, most starred repo, most used language, average stars, average forks.
- **CRUD on stored profiles**: list all, get one, delete, refresh (re-fetch from GitHub).
- **Search** stored profiles by username/name.
- **Pagination** and **sorting** (by followers, repos, stars, last analyzed, etc.) on the list endpoint.
- **Robust error handling** for invalid usernames, GitHub API errors (404 / rate limit), network failures, and MySQL errors.
- **Security & production middleware**: Helmet, CORS, rate limiting, compression, Morgan request logging.
- **Health check endpoint** for uptime monitoring.
- Clean **MVC** structure with fully separated routes / controllers / services / models.

---

## Folder Structure

```
github-profile-analyzer/
│
├── config/
│   └── db.js                  # MySQL connection pool
│
├── controllers/
│   └── githubController.js    # Request/response handling
│
├── routes/
│   └── githubRoutes.js        # Route definitions
│
├── services/
│   └── githubService.js       # GitHub API calls + insight calculations
│
├── models/
│   └── githubModel.js         # SQL queries (CRUD)
│
├── middleware/
│   ├── errorHandler.js        # 404 + global error handler
│   └── rateLimiter.js         # Request rate limiting
│
├── database/
│   └── schema.sql             # Full MySQL schema
│
├── .env.example
├── .gitignore
├── package.json
├── server.js
├── postman_collection.json
└── README.md
```

---

## Technologies Used

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Web framework / routing |
| MySQL (mysql2) | Relational database + driver |
| Axios | HTTP client for the GitHub API |
| dotenv | Environment variable management |
| Helmet | Security HTTP headers |
| CORS | Cross-origin resource sharing |
| express-rate-limit | API rate limiting |
| compression | Gzip response compression |
| Morgan | HTTP request logging |
| Nodemon | Dev-time auto-restart |

---

## Installation

```bash
# 1. Clone or download this repository
git clone <your-repo-url>
cd github-profile-analyzer

# 2. Install dependencies
npm install
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=github_profile_analyzer
DB_PORT=3306

GITHUB_API=https://api.github.com
GITHUB_TOKEN=

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

> **Tip:** `GITHUB_TOKEN` is optional but recommended. Without it, GitHub limits you to 60 unauthenticated requests/hour. A [personal access token](https://github.com/settings/tokens) (no scopes needed) raises that to 5,000/hour.

---

## Database Setup

1. Make sure MySQL is installed and running locally.
2. Run the schema file to create the database and table:

```bash
mysql -u root -p < database/schema.sql
```

This creates the `github_profile_analyzer` database and the `github_profiles` table with all required columns and indexes.

---

## Running the Project

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:5000` by default (or the `PORT` you set in `.env`).

- Health check: `GET http://localhost:5000/health`
- API base: `http://localhost:5000/api/github`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/github/analyze/:username` | Fetch, analyze, and store a GitHub profile |
| GET | `/api/github/profiles` | Get all stored profiles (search, sort, paginate) |
| GET | `/api/github/profile/:username` | Get one stored profile |
| PUT | `/api/github/refresh/:username` | Re-fetch latest data and update the stored profile |
| DELETE | `/api/github/profile/:username` | Delete a stored profile |
| GET | `/health` | Health check |

### Query params for `GET /api/github/profiles`

| Param | Default | Description |
|---|---|---|
| `search` | `""` | Filter by username or name (partial match) |
| `sortBy` | `last_analyzed_at` | One of: `followers`, `public_repos`, `total_stars`, `last_analyzed_at`, `username` |
| `order` | `DESC` | `ASC` or `DESC` |
| `page` | `1` | Page number |
| `limit` | `10` | Results per page |

---

## Sample Requests & Responses

### 1. Analyze a Profile

```
POST /api/github/analyze/octocat
```

**Response — 200 OK**
```json
{
  "success": true,
  "message": "Profile analyzed successfully",
  "data": {
    "id": 1,
    "username": "octocat",
    "name": "The Octocat",
    "bio": null,
    "avatar_url": "https://avatars.githubusercontent.com/u/583231?v=4",
    "profile_url": "https://github.com/octocat",
    "company": "@github",
    "location": "San Francisco",
    "blog": "https://github.blog",
    "followers": 18000,
    "following": 9,
    "public_repos": 8,
    "public_gists": 8,
    "total_stars": 2500,
    "total_forks": 1800,
    "most_used_language": "JavaScript",
    "most_starred_repo": "Hello-World",
    "average_stars": 312.5,
    "average_forks": 225.0,
    "account_created_at": "2011-01-25T18:44:36.000Z",
    "last_github_update": "2024-05-10T09:12:00.000Z",
    "last_analyzed_at": "2026-07-02T10:00:00.000Z",
    "created_at": "2026-07-02T10:00:00.000Z",
    "updated_at": "2026-07-02T10:00:00.000Z"
  }
}
```

### 2. Get All Profiles

```
GET /api/github/profiles?sortBy=followers&order=DESC&page=1&limit=10
```

**Response — 200 OK**
```json
{
  "success": true,
  "message": "Profiles fetched successfully",
  "data": [ { "username": "octocat", "followers": 18000, "...": "..." } ],
  "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
}
```

### 3. User Not Found

```
POST /api/github/analyze/this-user-should-not-exist-xyz
```

**Response — 404 Not Found**
```json
{
  "success": false,
  "message": "GitHub user not found"
}
```

### 4. Delete a Profile

```
DELETE /api/github/profile/octocat
```

**Response — 200 OK**
```json
{
  "success": true,
  "message": "Profile deleted successfully",
  "data": null
}
```

---

## Postman Collection

Import [`postman_collection.json`](./postman_collection.json) directly into Postman — it includes every endpoint pre-configured with a `baseUrl` and `username` variable you can edit.

**Steps:**
1. Open Postman → **Import** → select `postman_collection.json`.
2. Set the collection variable `baseUrl` (default `http://localhost:5000`) and `username` (default `octocat`).
3. Run requests in this order: **Analyze Profile** → **Get All Profiles** → **Get Single Profile** → **Refresh Profile** → **Delete Profile**.

---

## License

MIT — free to use for learning, assignments, and portfolio projects.
