# Use Node.js 20 with Alpine Linux for smaller image size
FROM node:20-alpine

# Install dependencies needed for Puppeteer and Chrome
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    wget \
    && rm -rf /var/cache/apk/*

# Tell Puppeteer to skip installing Chrome, we'll use the installed version
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy the generated TypeScript client package from the API build (parent context)
COPY document-generator-api/target/generated-sources/typescript-client/turners-document-generator-client-1.0.0-SNAPSHOT.tgz ./

# Copy package files from document-generator directory
COPY document-generator/package*.json ./
COPY document-generator/tsconfig.json ./

# Temporarily modify package.json to use local tarball
RUN sed -i 's|file:../document-generator-api/target/generated-sources/typescript-client/turners-document-generator-client-1.0.0-SNAPSHOT.tgz|file:./turners-document-generator-client-1.0.0-SNAPSHOT.tgz|' package.json

# Install dependencies
RUN npm ci --only=production

# Install TypeScript and build dependencies  
RUN npm install --save-dev typescript @types/node @types/express @types/mustache @types/cors ts-node

# Copy source code from document-generator directory
COPY document-generator/ .

# Build TypeScript
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const options = { hostname: 'localhost', port: 3000, path: '/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { \
        process.exit(res.statusCode === 200 ? 0 : 1); \
    }); \
    req.on('timeout', () => { req.destroy(); process.exit(1); }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Start the application
CMD ["npm", "start"]