# Backend Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY shared/package*.json ./shared/
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules

# Copy source code
COPY backend/ ./backend/
COPY shared/ ./shared/

# Build shared types first
WORKDIR /app/shared
RUN npm run build

# Build backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 claribox

# Copy built application
COPY --from=builder --chown=claribox:nodejs /app/backend/dist ./dist
COPY --from=builder --chown=claribox:nodejs /app/backend/node_modules ./node_modules
COPY --from=builder --chown=claribox:nodejs /app/backend/package.json ./package.json

USER claribox

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]