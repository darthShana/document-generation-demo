import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs';
import { MbiQuoteRequest } from '@turners/document-generator-client/api';
import { S3Service, S3UploadResult } from './s3-service';

export interface ProcessingResult {
  success: boolean;
  quotationNumber?: string;
  s3Result?: S3UploadResult;
  error?: string;
  messageId?: string;
}

export type GeneratePdfFunction = (mbiQuoteData: MbiQuoteRequest) => Promise<Buffer>;

export class SQSConsumer {
  private sqsClient: SQSClient;
  private queueUrl: string;
  private s3Service: S3Service;
  private generatePdfFunction: GeneratePdfFunction;
  private isRunning: boolean = false;
  private readonly pollingInterval: number = 5000; // 5 seconds

  constructor(generatePdfFunction: GeneratePdfFunction) {
    if (!process.env.AWS_REGION) {
      throw new Error('AWS_REGION environment variable is required');
    }
    
    if (!process.env.AWS_ACCOUNT_ID) {
      throw new Error('AWS_ACCOUNT_ID environment variable is required');
    }

    this.sqsClient = new SQSClient({
      region: process.env.AWS_REGION
    });
    
    this.queueUrl = process.env.SQS_QUEUE_URL || 
      `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/create-quote-document`;
    this.s3Service = new S3Service();
    this.generatePdfFunction = generatePdfFunction;
  }

  /**
   * Type guard to check if an object has all required MbiQuoteRequest properties
   */
  private isMbiQuoteRequest(obj: any): obj is MbiQuoteRequest {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    // Required fields from MbiQuoteRequest interface
    const requiredStringFields: (keyof MbiQuoteRequest)[] = [
      'quotationNumber', 'quotationDate', 'cover', 'coverPeriod', 'maxClaim',
      'additionalCovers', 'consumableItems', 'repatriationCosts', 'accommodationTravel',
      'roadsideAssistance', 'registration', 'vin', 'make', 'model', 'variant',
      'vehicleValue', 'fuelType', 'ccRating', 'year', 'odometer', 'modifications',
      'exclusions', 'excessAmount', 'totalPremium', 'gst', 'agentName', 'agentNumber'
    ];

    // Check all required fields exist and are strings
    for (const field of requiredStringFields) {
      if (!(field in obj) || typeof obj[field] !== 'string' || obj[field].trim() === '') {
        console.error(`✗ Invalid or missing required field '${field}': expected non-empty string, got ${typeof obj[field]}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Validate mandatory fields that cannot be empty
   */
  private validateMandatoryFields(request: MbiQuoteRequest): string[] {
    const mandatoryFields: (keyof MbiQuoteRequest)[] = [
      'quotationNumber',
      'quotationDate', 
      'cover',
      'registration',
      'vin',
      'make',
      'model',
      'totalPremium',
      'agentName'
    ];

    const invalidFields: string[] = [];

    for (const field of mandatoryFields) {
      const value = request[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        invalidFields.push(field);
      }
    }

    return invalidFields;
  }

  /**
   * Parse and validate message as MbiQuoteRequest with full type safety
   */
  private parseMbiQuoteRequest(messageBody: string): MbiQuoteRequest {
    let messageData: any;
    
    try {
      messageData = JSON.parse(messageBody);
    } catch (parseError) {
      throw new Error(`Invalid JSON in message body: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }

    // Type guard validation
    if (!this.isMbiQuoteRequest(messageData)) {
      throw new Error('Message does not conform to MbiQuoteRequest interface');
    }

    // Additional validation for mandatory fields
    const invalidMandatoryFields = this.validateMandatoryFields(messageData);
    if (invalidMandatoryFields.length > 0) {
      throw new Error(`Mandatory fields cannot be empty: ${invalidMandatoryFields.join(', ')}`);
    }

    // Ensure optional fields have default values
    const mbiQuoteRequest: MbiQuoteRequest = {
      ...messageData,
      electricPackage: messageData.electricPackage || '',
      modificationDetails: messageData.modificationDetails || '',
      exclusionDetails: messageData.exclusionDetails || ''
    };

    console.log(`✓ Validated MbiQuoteRequest for quotation: ${mbiQuoteRequest.quotationNumber}`);
    
    return mbiQuoteRequest;
  }

  /**
   * Process a single SQS message
   */
  private async processMessage(message: Message): Promise<ProcessingResult> {
    try {
      console.log('📨 Processing SQS message:', message.MessageId);
      
      if (!message.Body) {
        throw new Error('Message body is empty');
      }

      // Parse and validate message as MbiQuoteRequest
      const mbiQuoteRequest: MbiQuoteRequest = this.parseMbiQuoteRequest(message.Body);

      console.log(`🔄 Generating PDF for quotation: ${mbiQuoteRequest.quotationNumber}`);

      // Generate PDF using existing function with typed MbiQuoteRequest
      const pdfBuffer = await this.generatePdfFunction(mbiQuoteRequest);

      // Upload to S3
      const uploadResult = await this.s3Service.uploadQuotePdf(pdfBuffer, mbiQuoteRequest.quotationNumber);

      console.log(`✅ Successfully processed message for quotation ${mbiQuoteRequest.quotationNumber}`);

      // Delete message from queue after successful processing
      if (message.ReceiptHandle) {
        await this.deleteMessage(message.ReceiptHandle);
      }

      return {
        success: true,
        quotationNumber: mbiQuoteRequest.quotationNumber,
        s3Result: uploadResult
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error processing SQS message:', errorMessage);
      
      // Don't delete the message - it will be retried or go to DLQ
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete message from SQS queue
   */
  private async deleteMessage(receiptHandle: string): Promise<void> {
    const deleteCommand = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle
    });

    try {
      await this.sqsClient.send(deleteCommand);
      console.log('🗑️ Message deleted from queue');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error deleting message from queue:', errorMessage);
      throw new Error(`Failed to delete message: ${errorMessage}`);
    }
  }

  /**
   * Poll SQS queue for messages
   */
  private async pollMessages(): Promise<void> {
    const receiveCommand = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20, // Long polling
      MessageAttributeNames: ['All'],
      AttributeNames: ['All']
    });

    try {
      const result = await this.sqsClient.send(receiveCommand);
      
      if (result.Messages && result.Messages.length > 0) {
        console.log(`📬 Received ${result.Messages.length} messages from SQS`);
        
        // Process messages concurrently
        const processingPromises = result.Messages.map(message => 
          this.processMessage(message).catch(error => ({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            messageId: message.MessageId
          }))
        );

        const results = await Promise.allSettled(processingPromises);
        
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;
        
        console.log(`📊 Batch processing complete: ${successful} successful, ${failed} failed`);
      } else {
        // No messages received - this is normal with long polling
        console.log('📭 No messages received from SQS');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error polling SQS queue:', errorMessage);
    }
  }

  /**
   * Start the SQS consumer
   */
  public start(): void {
    if (this.isRunning) {
      console.log('⚠️  SQS Consumer is already running');
      return;
    }

    console.log(`🚀 Starting SQS Consumer for queue: ${this.queueUrl}`);
    this.isRunning = true;

    // Start polling loop
    const poll = async (): Promise<void> => {
      while (this.isRunning) {
        try {
          await this.pollMessages();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('❌ Error in polling loop:', errorMessage);
          // Wait before retrying on error
          await new Promise(resolve => setTimeout(resolve, this.pollingInterval));
        }
        
        // Short delay between polling cycles
        if (this.isRunning) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    };

    poll().catch(error => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('💥 Fatal error in SQS consumer:', errorMessage);
      this.isRunning = false;
    });
  }

  /**
   * Stop the SQS consumer
   */
  public stop(): void {
    console.log('🛑 Stopping SQS Consumer...');
    this.isRunning = false;
  }

  /**
   * Check if consumer is running
   */
  public isActive(): boolean {
    return this.isRunning;
  }
}