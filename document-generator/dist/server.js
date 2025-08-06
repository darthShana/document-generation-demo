"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mustache_1 = __importDefault(require("mustache"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const sqs_consumer_1 = require("./services/sqs-consumer");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000', 10);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve static files - handle both dev and production paths  
const getStaticPath = () => {
    const isDev = __dirname.includes('src') || !__dirname.includes('dist');
    return isDev
        ? path_1.default.join(__dirname, 'templates')
        : path_1.default.join(__dirname, '..', 'templates');
};
app.use('/static', express_1.default.static(getStaticPath()));
let mbiQuoteTemplate = '';
let browser = null;
// Load template - handle both dev and production paths
const getTemplatePath = () => {
    // In development, __dirname points to the source directory
    // In production, __dirname points to dist directory
    const isDev = __dirname.includes('src') || !__dirname.includes('dist');
    return isDev
        ? path_1.default.join(__dirname, 'templates', 'mbi-quote.html')
        : path_1.default.join(__dirname, '..', 'templates', 'mbi-quote.html');
};
try {
    const templatePath = getTemplatePath();
    mbiQuoteTemplate = fs_1.default.readFileSync(templatePath, 'utf8');
    console.log(`✅ Template loaded successfully from: ${templatePath}`);
}
catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error loading template:', errorMessage);
    process.exit(1);
}
/**
 * Initialize Puppeteer browser
 */
async function initializeBrowser() {
    try {
        browser = await puppeteer_1.default.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('✅ Puppeteer browser initialized');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error initializing browser:', errorMessage);
        process.exit(1);
    }
}
/**
 * Generate PDF from HTML content
 */
async function generatePDF(html) {
    if (!browser) {
        throw new Error('Browser not initialized');
    }
    const page = await browser.newPage();
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
    }
    finally {
        await page.close();
    }
}
/**
 * Generate PDF from MbiQuoteRequest data
 */
async function generateMbiQuotePDF(mbiQuoteData) {
    console.log(`🔄 Generating MBI Quote PDF for quotation: ${mbiQuoteData.quotationNumber}`);
    // Render HTML template with data
    const html = mustache_1.default.render(mbiQuoteTemplate, mbiQuoteData);
    // Generate PDF
    const pdfBuffer = await generatePDF(html);
    console.log(`✅ Successfully generated PDF for quotation: ${mbiQuoteData.quotationNumber}`);
    return pdfBuffer;
}
// Initialize browser and SQS consumer
let sqsConsumer = null;
/**
 * Initialize all services
 */
async function initializeServices() {
    await initializeBrowser();
    // Initialize SQS consumer if enabled
    if (process.env.ENABLE_SQS_CONSUMER === 'true') {
        console.log('🔄 Initializing SQS Consumer...');
        sqsConsumer = new sqs_consumer_1.SQSConsumer(generateMbiQuotePDF);
        sqsConsumer.start();
        console.log('✅ SQS Consumer started');
    }
    else {
        console.log('ℹ️  SQS Consumer disabled (set ENABLE_SQS_CONSUMER=true to enable)');
    }
}
initializeServices().catch(error => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('💥 Failed to initialize services:', errorMessage);
    process.exit(1);
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        sqsConsumerActive: sqsConsumer?.isActive() || false
    });
});
// Generate MBI Quote PDF endpoint
app.post('/generate/mbi-quote', async (req, res) => {
    try {
        const data = req.body;
        if (!data) {
            res.status(400).json({ error: 'Request body is required' });
            return;
        }
        // Validate required fields
        const requiredFields = [
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
        const mbiQuoteRequest = data;
        // Use the shared PDF generation function
        const pdf = await generateMbiQuotePDF(mbiQuoteRequest);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="mbi-quote-${mbiQuoteRequest.quotationNumber}.pdf"`);
        res.send(pdf);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error generating PDF:', errorMessage);
        res.status(500).json({ error: 'Failed to generate PDF document' });
    }
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});
// Error handler
app.use((error, req, res, next) => {
    console.error('💥 Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Document Generator Microservice running on port ${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`📄 Generate MBI Quote PDF: POST http://localhost:${PORT}/generate/mbi-quote`);
    if (process.env.ENABLE_SQS_CONSUMER === 'true') {
        console.log(`📨 SQS Consumer: Listening to queue create-quote-document`);
        console.log(`☁️  S3 Upload: Documents will be uploaded to bucket dpl-partner-quotes`);
    }
});
/**
 * Graceful shutdown handler
 */
async function gracefulShutdown() {
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
process.on('SIGINT', async () => {
    await gracefulShutdown();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await gracefulShutdown();
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=server.js.map