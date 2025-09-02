# Woorkroom — Backend

NestJS + Prisma + PostgreSQL + Redis + MinIO (S3-compatible).  
API runs on **http://localhost:3010**.

> **Note:** Do **not** run both `api` (prod) and `api-dev` (dev) on the same port (3010).

---

## Requirements

- Docker Desktop (or Docker Engine)
- Free ports: **3010** (API), **9100/9101** (MinIO), **5555** (Prisma Studio on demand)

---

## Setup

1. **Create env file**  
   - Copy **`.env.example` → `.env`** and fill in your values.  
   - Keep `.env` out of version control.  
   - The app reads all configuration from `.env` (DB URL, Redis URL, S3/MinIO, JWT, CORS, etc).

2. **Install dependencies (optional, only if running locally outside Docker)**  
   ```bash
   npm install


## Development (hot reload via Docker)

```bash
# Start dev API (hot reload) + infra (Postgres/Redis/MinIO)
npm run dev:up

# Tail dev API logs (you should see "File change detected..." on edits)
npm run dev:logs

# Create & apply a dev migration (rename "init" to what you did)
npm run prisma:migrate:dev --name=init

# Prisma Studio → http://localhost:5555
npm run prisma:studio:dev

# Stop dev API (infra remains if started separately)
npm run dev:down

## Dev URLs

- **API base:** http://localhost:3010/api  
- **Swagger (if enabled):** http://localhost:3010/api/docs  
- **MinIO Console:** http://localhost:9101  
- **S3 endpoint (for code):** http://localhost:9100

---

## Production (local/server via Docker)

```bash
# Build images and bring up the full stack (API + infra)
npm run prod:up:build

# Apply DB migrations in prod/CI
npm run prisma:deploy

# Tail prod API logs
npm run prod:logs

# Stop the stack (keeps volumes/data)
npm run prod:down

# Stop and remove volumes (Postgres/MinIO data) — irreversible
npm run prod:down:vol

## Infra utilities

```bash
# List running containers in this stack
npm run infra:ps

# Tail logs for all services
npm run infra:logs

# Open psql inside the Postgres container
npm run infra:psql

## Notes

- **Profiles:** Dev uses the `api-dev` service (hot reload). Prod uses `api`.
- **Persistence:** Postgres and MinIO data are stored in Docker volumes; use `prod:down:vol` only if you intend to wipe data.
- **Uploads:** Store files in MinIO (S3-compatible). Prefer presigned URLs from the backend for direct-to-S3 uploads from the client.

---

## Tech Stack

- **NestJS** (HTTP API, WebSockets)
- **Prisma + PostgreSQL** (database)
- **Redis** (pub/sub, queues, Socket.IO adapter)
- **MinIO (S3-compatible)** (file storage)
- **Swagger** (API docs, optional)
