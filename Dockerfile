# Development Dockerfile for UFOBeep Backend
# This is used for development with hot reloading
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    openssl \
    openssl-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev dependencies)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Create necessary directories
RUN mkdir -p uploads logs

# Expose ports
EXPOSE 3001
EXPOSE 9229

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start backend only in development mode with hot reloading
CMD ["npm", "run", "dev:backend"]