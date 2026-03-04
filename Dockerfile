# ===============================
# Stage 1: Install dependencies
# ===============================
FROM node:20-slim AS deps
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN apt-get update -y \
  && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

RUN npm ci
RUN npx prisma generate

# ===============================
# Stage 2: Build Next.js app
# ===============================
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args for NEXT_PUBLIC_* variables (inlined at build time by Next.js)
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# Dummy DATABASE_URL for prisma to pass validation during build (not used for actual connection)
ENV DATABASE_URL="mongodb://dummy:27017/dummy"

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ===============================
# Stage 3: Production runner
# ===============================
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# 👉 INI YANG KURANG KEMARIN
RUN apt-get update -y \
  && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]