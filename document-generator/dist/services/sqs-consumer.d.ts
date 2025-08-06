import { MbiQuoteRequest } from '@turners/document-generator-client/api';
import { S3UploadResult } from './s3-service';
export interface ProcessingResult {
    success: boolean;
    quotationNumber?: string;
    s3Result?: S3UploadResult;
    error?: string;
    messageId?: string;
}
export type GeneratePdfFunction = (mbiQuoteData: MbiQuoteRequest) => Promise<Buffer>;
export declare class SQSConsumer {
    private sqsClient;
    private queueUrl;
    private s3Service;
    private generatePdfFunction;
    private isRunning;
    private readonly pollingInterval;
    constructor(generatePdfFunction: GeneratePdfFunction);
    /**
     * Type guard to check if an object has all required MbiQuoteRequest properties
     */
    private isMbiQuoteRequest;
    /**
     * Validate mandatory fields that cannot be empty
     */
    private validateMandatoryFields;
    /**
     * Parse and validate message as MbiQuoteRequest with full type safety
     */
    private parseMbiQuoteRequest;
    /**
     * Process a single SQS message
     */
    private processMessage;
    /**
     * Delete message from SQS queue
     */
    private deleteMessage;
    /**
     * Poll SQS queue for messages
     */
    private pollMessages;
    /**
     * Start the SQS consumer
     */
    start(): void;
    /**
     * Stop the SQS consumer
     */
    stop(): void;
    /**
     * Check if consumer is running
     */
    isActive(): boolean;
}
//# sourceMappingURL=sqs-consumer.d.ts.map