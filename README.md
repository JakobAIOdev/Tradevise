# Tradevise

Tradevise ist eine Web-App zur Portfolioverwaltung und Trading-Simulation. Nutzer koennen Portfolios erstellen, Aktien suchen und beobachten, Kauf- und Verkaufsorders simulieren, die Portfolio-Performance auswerten, Rankings vergleichen und sich in privaten Gruppen messen.

## Funktionen

- Registrierung und Login mit Access- und Refresh-Tokens
- Portfolioverwaltung mit Cash-Bestand, Positionen, Transaktionen und aktivem Portfolio
- Simulierte Kauf- und Verkaufsorders
- Aktiensuche, Discovery-Ansicht, Detailseiten, Charts, Statistiken und Watchlists
- Live-Preisupdates mit Redis-gestuetzter Datenhaltung
- Globales Leaderboard und gruppenbasierte Portfolio-Rankings
- Background-Worker zur Synchronisierung von Marktdaten
- Docker-Setup fuer lokale Infrastruktur und produktionsnahes Deployment

## Tech Stack

| Bereich | Technologie |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Recharts, Zustand |
| Backend | NestJS, TypeScript, Prisma, PostgreSQL, Redis, JWT-Authentifizierung |
| Worker | Go, pgx, go-redis, cron jobs |
| Infrastruktur | Docker Compose, Caddy, PostgreSQL, Redis |

## Projektstruktur

```text
.
├── app
│   ├── backend      # NestJS-API, Prisma-Schema und Migrationen
│   ├── frontend     # React/Vite-Web-App
│   └── worker       # Go-Background-Worker fuer Marktdaten-Jobs
├── compose.yml      # Gemeinsame PostgreSQL- und Redis-Services
├── compose.dev.yml  # Port-Bindings fuer Entwicklung
├── compose.prod.yml # Produktionsnaher App-Stack
├── Makefile         # Docker-Compose-Shortcuts
└── .env.example     # Vorlage fuer Umgebungsvariablen
```

## Voraussetzungen

- Docker und Docker Compose
- Node.js und npm
- Go

Die Subprojekte nutzen aktuelle Toolchain-Versionen:

- Frontend: Vite, React, TypeScript
- Backend: NestJS, Prisma
- Worker: Go 1.26+

## Umgebung

Lege im Projektroot eine `.env` auf Basis der Vorlage an:

```bash
cp .env.example .env
```

Fuer das produktionsnahe Docker-Compose-Setup sind die Werte aus `.env.example` bereits auf Container-zu-Container-Kommunikation ausgelegt. Ersetze vor einer Veroeffentlichung unbedingt die Platzhalter:

```env
POSTGRES_PASSWORD=change-me-postgres-password
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
```

Wenn Backend oder Worker lokal ohne Docker gestartet werden, muessen die Verbindungen auf `localhost` zeigen:

```env
DATABASE_URL=postgresql://tradevise:change-me-postgres-password@localhost:5433/tradevise
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
FRONTEND_ORIGIN=http://localhost:5173
REFRESH_COOKIE_PATH=/auth
```

Die API-URL fuer das Frontend in der Entwicklung ist in `app/frontend/.env.development` hinterlegt:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Entwicklung

PostgreSQL und Redis starten:

```bash
make dev-up
```

Backend-Abhaengigkeiten installieren, Migrationen ausfuehren und API starten:

```bash
cd app/backend
npm install
npx prisma migrate dev --config=./prisma.config.ts
npm run start:dev
```

In einem zweiten Terminal das Frontend starten:

```bash
cd app/frontend
npm install
npm run dev
```

In einem dritten Terminal den Worker starten:

```bash
cd app/worker
go mod download
go run .
```

Standard-URLs in der lokalen Entwicklung:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6379`

Entwicklungsinfrastruktur stoppen:

```bash
make dev-down
```

## Docker Deployment

Vollstaendigen produktionsnahen Stack bauen und starten:

```bash
make prod-up
```

Das Frontend ist danach erreichbar unter:

```text
http://localhost:8080
```

Nuetzliche Befehle:

```bash
make prod-logs
make prod-ps
make prod-restart
make prod-down
```

## Skripte

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

## API-Ueberblick

Wichtige Backend-Endpunkte:

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- `GET /portfolios`, `POST /portfolios`, `PATCH /portfolios/active`
- `GET /portfolio`, `GET /portfolio/chart`, `POST /portfolio/buy`, `POST /portfolio/sell`
- `GET /portfolio/transactions`, `GET /portfolio/leaderboard`
- `GET /stocks/search`, `GET /stocks/discover`, `GET /stocks/watchlist`
- `GET /stocks/:ticker/chart`, `GET /stocks/:ticker/statistics`
- `POST /groups`, `POST /groups/join`, `GET /groups`, `GET /groups/:id/leaderboard`

## Testing

Tests koennen in den jeweiligen Subprojekten gestartet werden:

```bash
cd app/backend && npm run test
cd app/frontend && npm run test:run
cd app/worker && go test ./...
```

## Hinweise

- Tradevise ist eine Simulation und fuehrt keine echten Wertpapierorders aus.
- Marktdaten werden durch Backend und Worker geladen und zwischengespeichert.
- Refresh-Tokens werden in Cookies gespeichert; der Cookie-Pfad unterscheidet sich zwischen lokaler Entwicklung und produktionsnahem Docker-Routing.
