import express, { Request, Response, NextFunction, Application } from 'express';
import mustache from 'mustache';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import puppeteer, { Browser, Page } from 'puppeteer';
import { MbiQuoteRequest } from '@turners/document-generator-client/api';
import { SQSConsumer } from './services/sqs-consumer';

const app: Application = express();
if (!process.env.PORT) {
  throw new Error('PORT environment variable is required');
}
const PORT: number = parseInt(process.env.PORT, 10);

app.use(helmet());
app.use(cors());
app.use(express.json());
// Serve static files - handle both dev and production paths  
const getStaticPath = (): string => {
  const isDev = __dirname.includes('src') || !__dirname.includes('dist');
  return isDev 
    ? path.join(__dirname, 'templates')
    : path.join(__dirname, '..', 'templates');
};

app.use('/static', express.static(getStaticPath()));

let mbiQuoteTemplate: string = '';
let browser: Browser | null = null;

// Load template - handle both dev and production paths
const getTemplatePath = (): string => {
  // In development, __dirname points to the source directory
  // In production, __dirname points to dist directory
  const isDev = __dirname.includes('src') || !__dirname.includes('dist');
  return isDev 
    ? path.join(__dirname, 'templates', 'mbi-quote.html')
    : path.join(__dirname, '..', 'templates', 'mbi-quote.html');
};

const getLogoPath = (): string => {
  // In development, __dirname points to the source directory
  // In production, __dirname points to dist directory
  const isDev = __dirname.includes('src') || !__dirname.includes('dist');
  return isDev 
    ? path.join(__dirname, 'templates', 'autosure1.png')
    : path.join(__dirname, '..', 'templates', 'autosure1.png');
};

try {
  const templatePath = getTemplatePath();
  const logoPath = getLogoPath();
  
  // Load template
  let templateContent = fs.readFileSync(templatePath, 'utf8');
  
  // Load logo and convert to base64
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  
  // Replace the relative logo path with base64 data URL
  mbiQuoteTemplate = templateContent.replace('src="autosure1.png"', `src="${logoBase64}"`);
  
  console.log(`✅ Template loaded successfully from: ${templatePath}`);
  console.log(`✅ Logo embedded as base64 from: ${logoPath}`);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error('❌ Error loading template or logo:', errorMessage);
  process.exit(1);
}

/**
 * Initialize Puppeteer browser
 */
async function initializeBrowser(): Promise<void> {
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Puppeteer browser initialized');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error initializing browser:', errorMessage);
    process.exit(1);
  }
}

/**
 * Generate PDF from HTML content
 */
async function generatePDF(html: string): Promise<Buffer> {
  if (!browser) {
    throw new Error('Browser not initialized');
  }
  
  const page: Page = await browser.newPage();
  
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    });
    
    return pdf;
  } finally {
    await page.close();
  }
}

/**
 * Generate PDF from MbiQuoteRequest data
 */
async function generateMbiQuotePDF(mbiQuoteData: MbiQuoteRequest): Promise<Buffer> {
  console.log(`🔄 Generating MBI Quote PDF for quotation: ${mbiQuoteData.quotationNumber}`);
  
  // Render HTML template with data
  const html: string = mustache.render(mbiQuoteTemplate, mbiQuoteData);
  
  // Generate PDF
  const pdfBuffer = await generatePDF(html);
  
  console.log(`✅ Successfully generated PDF for quotation: ${mbiQuoteData.quotationNumber}`);
  return pdfBuffer;
}

// Initialize browser and SQS consumer
let sqsConsumer: SQSConsumer | null = null;

/**
 * Initialize all services
 */
async function initializeServices(): Promise<void> {
  await initializeBrowser();
  
  // Initialize SQS consumer (always enabled)
  console.log('🔄 Initializing SQS Consumer...');
  sqsConsumer = new SQSConsumer(generateMbiQuotePDF);
  sqsConsumer.start();
  console.log('✅ SQS Consumer started');
}

initializeServices().catch(error => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error('💥 Failed to initialize services:', errorMessage);
  process.exit(1);
});

// Health check endpoint
app.get('/health', (req: Request, res: Response): void => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    sqsConsumerActive: sqsConsumer?.isActive() || false
  });
});

// Generate MBI Quote PDF endpoint
app.post('/generate/mbi-quote', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    
    if (!data) {
      res.status(400).json({ error: 'Request body is required' });
      return;
    }

    // Validate required fields
    const requiredFields: (keyof MbiQuoteRequest)[] = [
      'quotationNumber', 'quotationDate', 'cover', 'coverPeriod', 'maxClaim',
      'additionalCovers', 'consumableItems', 'repatriationCosts', 'accommodationTravel',
      'roadsideAssistance', 'registration', 'vin', 'make', 'model', 'variant',
      'vehicleValue', 'fuelType', 'ccRating', 'year', 'odometer', 'modifications',
      'exclusions', 'excessAmount', 'totalPremium', 'gst', 'agentName', 'agentNumber'
    ];

    const missingFields = requiredFields.filter(field => !(field in data));
    if (missingFields.length > 0) {
      res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields: missingFields 
      });
      return;
    }

    // Cast to MbiQuoteRequest (assuming validation passed)
    const mbiQuoteRequest: MbiQuoteRequest = data as MbiQuoteRequest;

    // Use the shared PDF generation function
    const pdf = await generateMbiQuotePDF(mbiQuoteRequest);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="mbi-quote-${mbiQuoteRequest.quotationNumber}.pdf"`);
    res.send(pdf);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error generating PDF:', errorMessage);
    res.status(500).json({ error: 'Failed to generate PDF document' });
  }
});

// 404 handler
app.use((req: Request, res: Response): void => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, (): void => {
  console.log(`🚀 Document Generator Microservice running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📄 Generate MBI Quote PDF: POST http://localhost:${PORT}/generate/mbi-quote`);
  console.log(`📨 SQS Consumer: Listening to queue create-quote-document`);
  console.log(`☁️  S3 Upload: Documents will be uploaded to bucket dpl-partner-quotes`);
});

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(): Promise<void> {
  console.log('🔄 Shutting down gracefully...');
  
  // Stop SQS consumer
  if (sqsConsumer && sqsConsumer.isActive()) {
    sqsConsumer.stop();
    console.log('✅ SQS Consumer stopped');
  }
  
  // Close browser
  if (browser) {
    await browser.close();
    console.log('✅ Browser closed');
  }
}

process.on('SIGINT', async (): Promise<void> => {
  await gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', async (): Promise<void> => {
  await gracefulShutdown();
  process.exit(0);
});

export default app;