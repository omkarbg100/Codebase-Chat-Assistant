# ---- Dependencies Stage ----
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ---- Final Stage ----
FROM node:20-alpine AS final

WORKDIR /app

# Copy installed production modules
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY index.js .
COPY package*.json ./
COPY config/ ./config/
COPY controllers/ ./controllers/
COPY middleware/ ./middleware/
COPY models/ ./models/
COPY routes/ ./routes/

EXPOSE 5000

CMD ["node", "index.js"]
