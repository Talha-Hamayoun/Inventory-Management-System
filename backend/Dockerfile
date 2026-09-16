# -----------------------------
# 1. BUILD STAGE
# -----------------------------
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package*.json bun.lock* ./
COPY prisma ./prisma/

RUN bun install --frozen-lockfile

RUN bun run db:generate

COPY . .
RUN bun run build

# -----------------------------
# 2. PRODUCTION STAGE (optimized with standalone output)
# -----------------------------
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/prisma/main-db/client ./prisma/main-db/client

COPY package*.json bun.lock* ./

CMD ["bun", "start"]