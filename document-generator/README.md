# Document Generator Microservice

A TypeScript-based microservice for generating PDF documents from HTML templates using Puppeteer. Supports both REST API and SQS queue consumption with automatic S3 uploads.

## Features

- 🔄 **REST API**: Generate PDFs via HTTP endpoints
- 📨 **SQS Consumer**: Process messages from AWS SQS queues
- ☁️ **S3 Upload**: Automatic upload of generated PDFs to S3
- 🔒 **Type Safety**: Full TypeScript implementation with contract-first API
- 🐳 **Docker Ready**: Containerized with all dependencies
- 🏥 **Health Checks**: Built-in health monitoring

## Quick Start

### Using Docker (Recommended)

1. **Build and run with Docker Compose:**
   ```bash
   # Copy environment template
   cp .env .env
   
   # Edit .env with your AWS settings
   vim .env
   
   # Build and start
   docker-compose up --build
   ```

2. **Or build and run with Docker directly:**
   ```bash
   # Build image
   docker build -t document-generator .
   
   # Run container
   docker run -p 3000:3000 document-generator
   ```

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build TypeScript:**
   ```bash
   npm run build
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Health Check
```bash
GET /health
```

### Generate MBI Quote PDF
```bash
POST /generate/mbi-quote
Content-Type: application/json

{
  "quotationNumber": "35038365",
  "quotationDate": "22/12/2025",
  "cover": "Assist Plus",
  // ... other MbiQuoteRequest fields
}
```

## SQS Consumer

When `ENABLE_SQS_CONSUMER=true`, the service will:

1. Poll the configured SQS queue for `MbiQuoteRequest` messages
2. Generate PDF documents from the template
3. Upload PDFs to S3 bucket with structured keys:
   ```
   s3://dpl-partner-quotes/quotes/2025/August/35038365/35038365_schedule.pdf
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `AWS_REGION` | AWS region | `ap-southeast-2` |
| `AWS_ACCOUNT_ID` | Your AWS account ID | - |
| `SQS_QUEUE_URL` | Full SQS queue URL | - |
| `ENABLE_SQS_CONSUMER` | Enable SQS message processing | `false` |

## Docker Commands

```bash
# Build the Docker image
docker build -t document-generator .

# Run with basic settings
docker run -p 3000:3000 document-generator

# Run with SQS consumer enabled
docker run -p 3000:3000 \
  -e ENABLE_SQS_CONSUMER=true \
  -e AWS_REGION=ap-southeast-2 \
  -e AWS_ACCOUNT_ID=your-account-id \
  -e SQS_QUEUE_URL=your-queue-url \
  document-generator

# Run with Docker Compose
docker-compose up --build
```

## Development Scripts

```bash
# TypeScript development with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Watch mode for development
npm run dev:watch
```