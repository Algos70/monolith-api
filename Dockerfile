# ---------- BUILD STAGE ----------
FROM node:22-alpine AS builder
WORKDIR /app

# 1. Paketleri yükle
COPY package*.json ./
RUN npm ci

# 2. Kodları kopyala ve derle
COPY . .
RUN npm run build

# ---------- RUNTIME STAGE ----------
FROM node:22-alpine
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# 3. Build çıktısını ve bağımlılıkları taşı
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/typeorm.config.prod.js ./typeorm.config.js
COPY package*.json ./
RUN npm ci --omit=dev

# 4. Environment değişkenleri
ENV PORT=4000
EXPOSE 4000

# 5. Server'ı başlat (npm script ile migration ve seeding dahil)
CMD ["npm", "start"]
