# Tradevise

Tradevise is a full-stack portfolio management and trading simulation platform. It lets users create virtual portfolios, research stocks, place simulated buy and sell orders, track performance, and compete through public and private leaderboards.

The application is built as a multi-service system with a React frontend, a NestJS API, PostgreSQL for persistent data, Redis for live price caching, and a Go worker that synchronizes market data.

> Tradevise is a simulation. It does not execute real securities orders.

## Highlights

- Secure authentication with access tokens, refresh tokens, and cookie-based session renewal
- Multi-portfolio management with cash balances, holdings, transactions, and active portfolio selection
- Simulated market orders for buying and selling stocks
- Stock search, discovery, watchlists, detail pages, charts, and statistics
- Live market data from Lang & Schwarz with Redis-backed caching and pub/sub updates
- Global leaderboards and private group rankings
- Background worker for scheduled market data synchronization
- Docker Compose setup for local infrastructure and production-like deployment

## Screenshots

<table>
  <tr>
    <td width="50%">
      <strong>Home - Light</strong><br />
      <img src="docs/images/home-light.png" alt="Tradevise home dashboard in light mode" width="100%" />
    </td>
    <td width="50%">
      <strong>Home - Dark</strong><br />
      <img src="docs/images/home-dark.png" alt="Tradevise home dashboard in dark mode" width="100%" />
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>Portfolio - Light</strong><br />
      <img src="docs/images/portfolio-light.png" alt="Tradevise portfolio overview in light mode" width="100%" />
    </td>
    <td width="50%">
      <strong>Portfolio - Dark</strong><br />
      <img src="docs/images/portfolio-dark.png" alt="Tradevise portfolio overview in dark mode" width="100%" />
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>Stock Detail - Light</strong><br />
      <img src="docs/images/stock-detail-light.png" alt="Tradevise stock detail page in light mode" width="100%" />
    </td>
    <td width="50%">
      <strong>Stock Detail - Dark</strong><br />
      <img src="docs/images/stock-detail-dark.png" alt="Tradevise stock detail page in dark mode" width="100%" />
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>Leaderboard - Light</strong><br />
      <img src="docs/images/leaderboard-light.png" alt="Tradevise leaderboard in light mode" width="100%" />
    </td>
    <td width="50%">
      <strong>Leaderboard - Dark</strong><br />
      <img src="docs/images/leaderboard-dark.png" alt="Tradevise leaderboard in dark mode" width="100%" />
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>Discover - Light</strong><br />
      <img src="docs/images/discover-light.png" alt="Tradevise stock discovery view in light mode" width="100%" />
    </td>
    <td width="50%">
      <strong>Discover - Dark</strong><br />
      <img src="docs/images/discover-dark.png" alt="Tradevise stock discovery view in dark mode" width="100%" />
    </td>
  </tr>
</table>

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Recharts, Zustand |
| Backend | NestJS 11, TypeScript, Prisma, PostgreSQL, Redis, JWT authentication |
| Worker | Go 1.26, pgx, go-redis, robfig/cron |
| Infrastructure | Docker Compose, Caddy, PostgreSQL, Redis |

## Architecture

```mermaid
flowchart LR
    user[User]

    subgraph application[Application]
        frontend[Frontend<br/>React + Vite]
        backend[Backend API<br/>NestJS + Prisma]
        worker[Worker<br/>Go market jobs]
    end

    subgraph data[Data Layer]
        postgres[(PostgreSQL<br/>users, portfolios, trades)]
        redis[(Redis<br/>prices, cache, pub/sub)]
    end

    market[Lang & Schwarz<br/>market data]
    docker[Docker Compose<br/>runtime orchestration]

    user --> frontend
    frontend <--> backend

    backend --> postgres
    backend <--> redis

    worker --> market
    worker --> postgres
    worker --> redis

    docker -. runs .-> application
    docker -. runs .-> data
```

## Project Structure

```text
.
|-- app
|   |-- backend      # NestJS API, Prisma schema, and migrations
|   |-- frontend     # React/Vite web application
|   `-- worker       # Go worker for scheduled market data jobs
|-- docs/images      # README screenshots
|-- compose.yml      # Shared PostgreSQL and Redis services
|-- compose.dev.yml  # Development port bindings
|-- compose.prod.yml # Production-like application stack
|-- Makefile         # Docker Compose shortcuts
`-- .env.example     # Environment variable template
```

## Requirements

- Docker and Docker Compose
- Node.js and npm
- Go 1.26+

## Quick Start

Create the root environment file:

```bash
cp .env.example .env
```

For host-based development, update the service connections in `.env` before running migrations:

```env
DATABASE_URL=postgresql://tradevise:change-me-postgres-password@localhost:5433/tradevise
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
FRONTEND_ORIGIN=http://localhost:5173
REFRESH_COOKIE_PATH=/auth
```

Start PostgreSQL and Redis:

```bash
make dev-up
```

Install and start the backend:

```bash
cd app/backend
npm ci
npx prisma migrate dev --config=./prisma.config.ts
npm run start:dev
```

Start the frontend in a second terminal:

```bash
cd app/frontend
npm ci
npm run dev
```

Start the worker in a third terminal:

```bash
cd app/worker
go mod download
go run .
```

Local services are available at:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:3000` |
| OpenAPI UI | `http://localhost:3000/api-docs` |
| OpenAPI JSON | `http://localhost:3000/api-docs-json` |
| PostgreSQL | `localhost:5433` |
| Redis | `localhost:6379` |

Stop the local infrastructure with:

```bash
make dev-down
```

## Configuration

The root `.env` file is shared by Docker Compose, the backend, and the worker. The default values in `.env.example` are configured for container-to-container communication in the production-like Docker setup.

Before publishing or deploying the application, replace the placeholder secrets:

```env
POSTGRES_PASSWORD=change-me-postgres-password
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
```

When running the backend or worker directly on your host machine, point database and Redis connections at the locally published ports:

```env
DATABASE_URL=postgresql://tradevise:change-me-postgres-password@localhost:5433/tradevise
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
FRONTEND_ORIGIN=http://localhost:5173
REFRESH_COOKIE_PATH=/auth
```

The frontend development API base URL is stored separately in `app/frontend/.env.development`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Docker Deployment

Build and start the production-like stack:

```bash
make prod-up
```

The frontend is served through Caddy at:

```text
http://localhost:8080
```

Useful Docker commands:

```bash
make prod-logs
make prod-ps
make prod-restart
make prod-down
```

## Development Commands

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

Docker infrastructure:

```bash
make dev-up
make dev-logs
make dev-ps
make dev-restart
make dev-down
```

## API Overview

Important backend endpoints:

| Area | Endpoints |
| --- | --- |
| Authentication | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| Portfolios | `GET /portfolios`, `POST /portfolios`, `PATCH /portfolios/active` |
| Portfolio data | `GET /portfolio`, `GET /portfolio/chart`, `GET /portfolio/transactions`, `GET /portfolio/leaderboard` |
| Trading | `POST /portfolio/buy`, `POST /portfolio/sell` |
| Stocks | `GET /stocks/search`, `GET /stocks/discover`, `GET /stocks/watchlist` |
| Stock details | `GET /stocks/:ticker/chart`, `GET /stocks/:ticker/statistics` |
| Groups | `POST /groups`, `POST /groups/join`, `GET /groups`, `GET /groups/:id/leaderboard` |

The backend also exposes an OpenAPI specification:

- Swagger UI: `http://localhost:3000/api-docs`
- Raw OpenAPI JSON: `http://localhost:3000/api-docs-json`

## Testing

Run tests in the individual subprojects:

```bash
cd app/backend && npm run test
cd app/frontend && npm run test:run
cd app/worker && go test ./...
```

## Notes

- Tradevise does not connect to a broker and cannot place real orders.
- Market data is loaded from Lang & Schwarz, persisted where needed, and cached through Redis.
- Refresh tokens are stored in cookies. The cookie path differs between local development and the Docker reverse-proxy setup.
