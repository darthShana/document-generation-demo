export interface S3UploadResult {
    success: boolean;
    key: string;
    bucket: string;
    url: string;
    etag?: string;
}
export declare class S3Service {
    private s3Client;
    private readonly bucketName;
    constructor();
    /**
     * Generate S3 key for quote document
     * @param quotationNumber - The quotation number
     * @returns S3 key in format quotes/YYYY/Month/quotationNumber/quotationNumber_schedule.pdf
     */
    generateS3Key(quotationNumber: string): string;
    /**
     * Upload PDF buffer to S3
     * @param pdfBuffer - The PDF document as buffer
     * @param quotationNumber - The quotation number
     * @returns S3 upload result
     */
    uploadQuotePdf(pdfBuffer: Buffer, quotationNumber: string): Promise<S3UploadResult>;
}
//# sourceMappingURL=s3-service.d.ts.map