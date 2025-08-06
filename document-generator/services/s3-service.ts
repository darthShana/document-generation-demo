import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export interface S3UploadResult {
  success: boolean;
  key: string;
  bucket: string;
  url: string;
  etag?: string;
}

export class S3Service {
  private s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    if (!process.env.AWS_REGION) {
      throw new Error('AWS_REGION environment variable is required');
    }
    
    if (!process.env.S3_BUCKET_NAME) {
      throw new Error('S3_BUCKET_NAME environment variable is required');
    }

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION
    });
    
    this.bucketName = process.env.S3_BUCKET_NAME;
  }

  /**
   * Generate S3 key for quote document
   * @param quotationNumber - The quotation number
   * @returns S3 key in format quotes/YYYY/Month/quotationNumber/quotationNumber_schedule.pdf
   */
  public generateS3Key(quotationNumber: string): string {
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
  public async uploadQuotePdf(pdfBuffer: Buffer, quotationNumber: string): Promise<S3UploadResult> {
    const key = this.generateS3Key(quotationNumber);
    
    const command = new PutObjectCommand({
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
        url: `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
        etag: result.ETag
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('✗ Error uploading PDF to S3:', errorMessage);
      throw new Error(`Failed to upload PDF to S3: ${errorMessage}`);
    }
  }
}