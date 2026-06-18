# Multi-stage Dockerfile for Kuberna Labs (backend + frontend single service)

# Stage 1: Build SDK
FROM node:18-alpine AS sdk-builder
WORKDIR /app/sdk
COPY sdk/package*.json ./
RUN npm ci
COPY sdk/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci
RUN cd backend && npm ci
COPY . .
COPY --from=sdk-builder /app/sdk/dist ./sdk/dist
RUN cd backend && npm run build

# Stage 3: Build Frontend (static export)
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
COPY --from=sdk-builder /app/sdk/dist /app/sdk/dist
RUN npm run build

# Stage 4: Production
FROM node:18-alpine
WORKDIR /app

RUN apk add --no-cache curl python3 make g++

COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci --production
RUN cd backend && npm ci --production

COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/contracts ./contracts
COPY --from=backend-builder /app/artifacts ./artifacts
COPY --from=backend-builder /app/backend/.env.example ./backend/.env.example
COPY --from=frontend-builder /app/frontend/out ./frontend/out

# Pre-download Transformers.js model for local intent parsing
RUN node -e "const { env } = require('@xenova/transformers'); env.cacheDir = '/app/models'; require('@xenova/transformers').pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2').then(m => { console.log('Model downloaded'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })"

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "const p = process.env.PORT || 3000; require('http').get('http://localhost:'+p+'/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "backend/dist/index.js"]
