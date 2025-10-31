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

# 3. Build çıktısını ve bağımlılıkları taşı
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev

# 4. Environment değişkenleri
ENV PORT=4000
EXPOSE 4000

# 5. Server'ı başlat
CMD ["node", "dist/src/index.js"]
