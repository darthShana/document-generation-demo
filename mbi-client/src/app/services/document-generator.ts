import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MBIQuoteData {
  quotationNumber: string;
  quotationDate: string;
  cover: string;
  coverPeriod: string;
  maxClaim: string;
  additionalCovers: string;
  consumableItems: string;
  repatriationCosts: string;
  accommodationTravel: string;
  roadsideAssistance: string;
  electricPackage: string;
  registration: string;
  vin: string;
  make: string;
  model: string;
  variant: string;
  vehicleValue: string;
  fuelType: string;
  ccRating: string;
  year: string;
  odometer: string;
  modifications: string;
  modificationDetails: string;
  exclusions: string;
  exclusionDetails: string;
  excessAmount: string;
  totalPremium: string;
  gst: string;
  agentName: string;
  agentNumber: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentGeneratorService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  generateMBIQuotePDF(data: MBIQuoteData): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(
      `${this.apiUrl}/generate/mbi-quote`,
      data,
      {
        headers,
        responseType: 'blob'
      }
    );
  }

  getSampleMBIQuotePDF(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/generate/mbi-quote/sample`,
      {
        responseType: 'blob'
      }
    );
  }
}
