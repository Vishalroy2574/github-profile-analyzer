# GitHub Profile Analyzer

A backend service that gathers GitHub profile data, analyzes repository metrics, and stores the results in MySQL.

This project uses **Node.js**, **Express**, and **MySQL** with a clean separation between routes, business logic, and database code.

---

## What it does

- Fetches public GitHub user data and repository information.
- Computes stats such as total stars, forks, most-used language, and averages.
- Stores analyzed profiles in a MySQL database.
- Lets you search, list, refresh, and delete saved profiles.
- Includes middleware for security headers, logging, compression, and rate limiting.

---

## Project structure

```
github-profile-analyzer/
├── config/
│   └── db.js
├── controllers/
│   └── githubController.js
├── routes/
│   └── githubRoutes.js
├── services/
│   └── githubService.js
├── models/
│   └── githubModel.js
├── middleware/
│   ├── errorHandler.js
│   └── rateLimiter.js
├── database/
│   └── schema.sql
├── .env.example
├── .gitignore
├── package.json
├── server.js
├── postman_collection.json
└── README.md
```

---

## Technology stack

- Node.js
- Express
- MySQL (`mysql2`)
- Axios
- dotenv
- Helmet
- CORS
- express-rate-limit
- compression
- Morgan
- Nodemon (development)

---

## Setup

```bash
git clone <your-repo-url>
cd github-profile-analyzer
npm install
```

---

## Configuration

Copy the environment template and update it for your machine:

```bash
copy .env.example .env
```

Example `.env` values:

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

If you want to avoid GitHub rate limits, add a personal access token in `GITHUB_TOKEN`.

---

## Database setup

1. Start your MySQL server.
2. Run the schema file:

```bash
mysql -u root -p < database/schema.sql
```

This creates the `github_profile_analyzer` database and the `github_profiles` table.

---

## Run the application

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The API starts at `http://localhost:5000` by default, or on the `PORT` you set.

- Health check: `GET /health`
- API root: `http://localhost:5000/api/github`

---

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/github/analyze/:username` | Fetch and save GitHub profile data |
| GET | `/api/github/profiles` | List stored profiles |
| GET | `/api/github/profile/:username` | Get a saved profile |
| PUT | `/api/github/refresh/:username` | Refresh profile data from GitHub |
| DELETE | `/api/github/profile/:username` | Delete a profile |
| GET | `/health` | Server health check |

### Query parameters for `/api/github/profiles`

- `search` — text search on username or name
- `sortBy` — `followers`, `public_repos`, `total_stars`, `last_analyzed_at`, or `username`
- `order` — `ASC` or `DESC`
- `page` — page number
- `limit` — results per page

---

## Example requests

Analyze a profile:

```bash
POST http://localhost:5000/api/github/analyze/octocat
```

List profiles:

```bash
GET http://localhost:5000/api/github/profiles?sortBy=followers&order=DESC&page=1&limit=10
```

Get one profile:

```bash
GET http://localhost:5000/api/github/profile/octocat
```

Refresh profile data:

```bash
PUT http://localhost:5000/api/github/refresh/octocat
```

Delete a profile:

```bash
DELETE http://localhost:5000/api/github/profile/octocat
```

---

## Postman

Import `postman_collection.json` into Postman to test every route.

1. Import the collection.
2. Set `baseUrl` to `http://localhost:5000`.
3. Update `username` if needed.
4. Run the requests.

---

## License

MIT
