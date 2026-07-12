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

# Copy package manifests and install production dependencies securely
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled assets with strict non-privileged ownership
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
