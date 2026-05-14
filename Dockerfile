# ---- Stage 1: Build React client ----
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --silent
COPY client/ ./
RUN npm run build

# ---- Stage 2: Production server ----
FROM node:18-alpine
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production --silent

# Copy server code
COPY server/ ./server/

# Copy React build from stage 1
COPY --from=client-builder /app/client/build ./client/build

# Ensure uploads directory exists
RUN mkdir -p uploads

EXPOSE 8000

ENV NODE_ENV=production

CMD ["node", "server/index.js"]
