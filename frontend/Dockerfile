# -----------------------------
# 1. BUILD STAGE
# -----------------------------
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package*.json bun.lock* ./

RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# -----------------------------
# 2. PRODUCTION STAGE (optimized with standalone output)
# -----------------------------
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.next/standalone ./.next/standalone

COPY --from=builder /app/.next/static ./.next/standalone/.next/static
COPY --from=builder /app/public ./.next/standalone/public

COPY package*.json bun.lock* ./

CMD ["bun", ".next/standalone/server.js"]