FROM node:24 AS deps

WORKDIR /usr/src/app
ARG DATABASE_URL=postgresql://tradevise:secret@postgres:5432/tradevise
ENV DATABASE_URL=${DATABASE_URL}

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

FROM node:24 AS builder

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

RUN npm run build

FROM node:24-slim AS runtime

WORKDIR /usr/src/app
ENV NODE_ENV=production
ARG DATABASE_URL=postgresql://tradevise:secret@postgres:5432/tradevise
ENV DATABASE_URL=${DATABASE_URL}

RUN apt-get update -y && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
