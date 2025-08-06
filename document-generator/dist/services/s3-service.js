"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
class S3Service {
    constructor() {
        this.bucketName = 'dpl-partner-quotes';
        this.s3Client = new client_s3_1.S3Client({
            region: process.env.AWS_REGION || 'ap-southeast-2'
        });
    }
    /**
     * Generate S3 key for quote document
     * @param quotationNumber - The quotation number
     * @returns S3 key in format quotes/YYYY/Month/quotationNumber/quotationNumber_schedule.pdf
     */
    generateS3Key(quotationNumber) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.toLocaleString('default', { month: 'long' });
        return `quotes/${year}/${month}/${quotationNumber}/${quotationNumber}_schedule.pdf`;
    }
    /**
     * Upload PDF buffer to S3
     * @param pdfBuffer - The PDF document as buffer
     * @param quotationNumber - The quotation number
     * @returns S3 upload result
     */
    async uploadQuotePdf(pdfBuffer, quotationNumber) {
        const key = this.generateS3Key(quotationNumber);
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            ContentDisposition: `attachment; filename="${quotationNumber}_schedule.pdf"`,
            Metadata: {
                quotationNumber: quotationNumber,
                documentType: 'mbi-quote',
                generatedAt: new Date().toISOString()
            }
        });
        try {
            const result = await this.s3Client.send(command);
            console.log(`✓ Successfully uploaded PDF to S3: ${key}`);
            return {
                success: true,
                key: key,
                bucket: this.bucketName,
                url: `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'ap-southeast-2'}.amazonaws.com/${key}`,
                etag: result.ETag
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('✗ Error uploading PDF to S3:', errorMessage);
            throw new Error(`Failed to upload PDF to S3: ${errorMessage}`);
        }
    }
}
exports.S3Service = S3Service;
//# sourceMappingURL=s3-service.js.map