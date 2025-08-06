export * from './documentGenerationApi';
import { DocumentGenerationApi } from './documentGenerationApi';
export * from './healthApi';
import { HealthApi } from './healthApi';
import * as http from 'http';

export class HttpError extends Error {
    constructor (public response: http.IncomingMessage, public body: any, public statusCode?: number) {
        super('HTTP request failed');
        this.name = 'HttpError';
    }
}

export { RequestFile } from '../model/models';

export const APIS = [DocumentGenerationApi, HealthApi];
