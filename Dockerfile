# Multi-stage build for Digital Asset Sovereignty
FROM node:20-slim AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
# Modernized dependency installation omitting devDependencies
RUN npm ci --omit=dev
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
