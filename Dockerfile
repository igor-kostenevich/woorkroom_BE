# ---------- dev ----------
  FROM node:20-bookworm-slim AS dev
  WORKDIR /app
  
  ENV NODE_ENV=development
  ENV PORT=3010
  ENV CHOKIDAR_USEPOLLING=1
  ENV WATCHPACK_POLLING=true
  ENV TS_NODE_TRANSPILE_ONLY=1
  
  RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates procps \
    && rm -rf /var/lib/apt/lists/*
  
  COPY package*.json ./
  RUN npm ci
  
  COPY prisma ./prisma
  RUN npx prisma generate
  
  COPY . .
  
  EXPOSE 3010 9229
  CMD ["npm","run","start:dev"]
  
  
  # ---------- builder ----------
  FROM node:20-bookworm-slim AS builder
  WORKDIR /app
  ENV NODE_ENV=production
  
  RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
  
  COPY package*.json ./
  RUN npm ci
  
  COPY prisma ./prisma
  RUN npx prisma generate
  
  COPY tsconfig*.json nest-cli.json ./
  COPY src ./src
  RUN npm run build
  
  
  # ---------- runner ----------
  FROM node:20-bookworm-slim AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  ENV PORT=3010
  
  RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
  
  COPY package*.json ./
  RUN npm ci --omit=dev && npm cache clean --force
  
  COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
  COPY prisma ./prisma
  COPY --from=builder /app/dist /app/dist
  
  RUN chown -R node:node /app
  USER node
  
  EXPOSE 3010
  CMD ["npm","run","start:prod"]
  