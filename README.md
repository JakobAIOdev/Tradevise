# Tradevise

Tradevise is a web app for portfolio management and trading simulation. Users can create portfolios, search for and watch stocks, simulate buy and sell orders, analyze portfolio performance, compare rankings, and compete in private groups.

## Features

- Registration and login with access and refresh tokens
- Portfolio management with cash balance, holdings, transactions, and active portfolio selection
- Simulated buy and sell orders
- Stock search, discovery view, detail pages, charts, statistics, and watchlists
- Real live market data from Lang & Schwarz, with Redis-backed price updates
- Global leaderboard and group-based portfolio rankings
- Background worker for synchronizing market data
- Docker setup for local infrastructure and production-like deployment

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Recharts, Zustand |
| Backend | NestJS, TypeScript, Prisma, PostgreSQL, Redis, JWT authentication |
| Worker | Go, pgx, go-redis, cron jobs |
| Infrastructure | Docker Compose, Caddy, PostgreSQL, Redis |

## Architecture

```mermaid
flowchart LR
    user[User]

    subgraph app[Application]
        frontend[Frontend<br/>React + Vite]
        backend[Backend API<br/>NestJS + Prisma]
        worker[Worker<br/>Go market jobs]
    end

    subgraph data[Data Layer]
        postgres[(PostgreSQL<br/>users, portfolios, trades)]
        redis[(Redis<br/>live prices, pub/sub)]
    end

    market[Lang & Schwarz<br/>live market data]
    docker[Docker Compose<br/>local and production-like stack]

    user --> frontend
    frontend <--> backend

    backend --> postgres
    backend <--> redis

    worker --> market
    worker --> postgres
    worker --> redis

    docker -. runs .-> app
    docker -. runs .-> data
```

## Project Structure

```text
.
|-- app
|   |-- backend      # NestJS API, Prisma schema, and migrations
|   |-- frontend     # React/Vite web app
|   `-- worker       # Go background worker for market data jobs
|-- compose.yml      # Shared PostgreSQL and Redis services
|-- compose.dev.yml  # Port bindings for development
|-- compose.prod.yml # Production-like app stack
|-- Makefile         # Docker Compose shortcuts
`-- .env.example     # Environment variable template
```

## Requirements

- Docker and Docker Compose
- Node.js and npm
- Go

The subprojects use current toolchain versions:

- Frontend: Vite, React, TypeScript
- Backend: NestJS, Prisma
- Worker: Go 1.26+

## Environment

Create a `.env` file in the project root from the template:

```bash
cp .env.example .env
```

For the production-like Docker Compose setup, the values in `.env.example` are already configured for container-to-container communication. Replace the placeholders before publishing or deploying:

```env
POSTGRES_PASSWORD=change-me-postgres-password
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
```

If the backend or worker is started locally without Docker, the connections must point to `localhost`:

```env
DATABASE_URL=postgresql://tradevise:change-me-postgres-password@localhost:5433/tradevise
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
FRONTEND_ORIGIN=http://localhost:5173
REFRESH_COOKIE_PATH=/auth
```

The frontend development API URL is stored in `app/frontend/.env.development`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Development

Start PostgreSQL and Redis:

```bash
make dev-up
```

Install backend dependencies, run migrations, and start the API:

```bash
cd app/backend
npm install
npx prisma migrate dev --config=./prisma.config.ts
npm run start:dev
```

In a second terminal, start the frontend:

```bash
cd app/frontend
npm install
npm run dev
```

In a third terminal, start the worker:

```bash
cd app/worker
go mod download
go run .
```

Default URLs in local development:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6379`

Stop the development infrastructure:

```bash
make dev-down
```

## Docker Deployment

Build and start the full production-like stack:

```bash
make prod-up
```

The frontend is then available at:

```text
http://localhost:8080
```

Useful commands:

```bash
make prod-logs
make prod-ps
make prod-restart
make prod-down
```

## Scripts

Backend:

```bash
cd app/backend
npm run start:dev
npm run build
npm run lint
npm run test
```

Frontend:

```bash
cd app/frontend
npm run dev
npm run build
npm run lint
npm run test:run
```

Worker:

```bash
cd app/worker
go test ./...
go run .
```

## API Overview

Important backend endpoints:

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- `GET /portfolios`, `POST /portfolios`, `PATCH /portfolios/active`
- `GET /portfolio`, `GET /portfolio/chart`, `POST /portfolio/buy`, `POST /portfolio/sell`
- `GET /portfolio/transactions`, `GET /portfolio/leaderboard`
- `GET /stocks/search`, `GET /stocks/discover`, `GET /stocks/watchlist`
- `GET /stocks/:ticker/chart`, `GET /stocks/:ticker/statistics`
- `POST /groups`, `POST /groups/join`, `GET /groups`, `GET /groups/:id/leaderboard`

## Testing

Tests can be run in the respective subprojects:

```bash
cd app/backend && npm run test
cd app/frontend && npm run test:run
cd app/worker && go test ./...
```

## Notes

- Tradevise is a simulation and does not execute real securities orders.
- Market data is loaded from Lang & Schwarz by the backend and worker, then cached locally.
- Refresh tokens are stored in cookies; the cookie path differs between local development and production-like Docker routing.
