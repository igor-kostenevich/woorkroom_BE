# ---------- builder ----------
  FROM node:20-bookworm-slim AS builder
  WORKDIR /app
  
  # (не обов'язково, але позбавляє prisma warn про openssl)
  RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
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
  
  # (аналогічно — щоб не було prisma warn)
  RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
  
  COPY package*.json ./
  RUN npm ci --omit=dev && npm cache clean --force
  
  COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
  COPY prisma ./prisma
  COPY --from=builder /app/dist /app/dist
  
  RUN chown -R node:node /app
  USER node
  
  EXPOSE 3010
  CMD ["npm", "run", "start:prod"]
  