# syntax=docker/dockerfile:1

# --- deps: install node_modules (bcrypt needs a compiler to build its native binding) ---
FROM node:22-slim AS deps
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- runtime: slim image with only what's needed to run the server ---
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY server.js resources.js ./

EXPOSE 5000
USER node
CMD ["node", "server.js"]
