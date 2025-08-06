import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DocumentGeneratorService, MBIQuoteData } from '../services/document-generator';

@Component({
  selector: 'app-mbi-quote-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mbi-quote-form.html',
  styleUrl: './mbi-quote-form.css'
})
export class MbiQuoteFormComponent {
  mbiForm: FormGroup;
  isGenerating = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private documentService: DocumentGeneratorService
  ) {
    this.mbiForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      quotationNumber: ['', [Validators.required]],
      quotationDate: ['', [Validators.required]],
      cover: ['Assist Plus', [Validators.required]],
      coverPeriod: ['36 months', [Validators.required]],
      maxClaim: ['OPEN LIMIT', [Validators.required]],
      additionalCovers: ['Accesses and comfort, Driver assistance and Safety, Entertainment and Performance'],
      consumableItems: ['Up to $750 per claim'],
      repatriationCosts: ['Up to $500 per claim'],
      accommodationTravel: ['Up to $1,500 per claim'],
      roadsideAssistance: ['Yes'],
      electricPackage: [''],
      registration: ['', [Validators.required]],
      vin: ['', [Validators.required]],
      make: ['', [Validators.required]],
      model: ['', [Validators.required]],
      variant: [''],
      vehicleValue: ['', [Validators.required]],
      fuelType: ['', [Validators.required]],
      ccRating: [''],
      year: ['', [Validators.required]],
      odometer: ['', [Validators.required]],
      modifications: ['No'],
      modificationDetails: [''],
      exclusions: ['No'],
      exclusionDetails: [''],
      excessAmount: ['$150', [Validators.required]],
      totalPremium: ['', [Validators.required]],
      gst: ['', [Validators.required]],
      agentName: ['', [Validators.required]],
      agentNumber: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.mbiForm.valid) {
      this.generatePDF();
    } else {
      this.markFormGroupTouched();
    }
  }

  generatePDF(): void {
    this.isGenerating = true;
    this.errorMessage = '';

    const formData: MBIQuoteData = this.mbiForm.value;

    this.documentService.generateMBIQuotePDF(formData).subscribe({
      next: (blob: Blob) => {
        this.downloadPDF(blob, `mbi-quote-${formData.quotationNumber}.pdf`);
        this.isGenerating = false;
      },
      error: (error) => {
        console.error('Error generating PDF:', error);
        this.errorMessage = 'Failed to generate PDF. Please try again.';
        this.isGenerating = false;
      }
    });
  }

  generateSamplePDF(): void {
    this.isGenerating = true;
    this.errorMessage = '';

    this.documentService.getSampleMBIQuotePDF().subscribe({
      next: (blob: Blob) => {
        this.downloadPDF(blob, 'mbi-quote-sample.pdf');
        this.isGenerating = false;
      },
      error: (error) => {
        console.error('Error generating sample PDF:', error);
        this.errorMessage = 'Failed to generate sample PDF. Please try again.';
        this.isGenerating = false;
      }
    });
  }

  private downloadPDF(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.mbiForm.controls).forEach(key => {
      const control = this.mbiForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.mbiForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  resetForm(): void {
    this.mbiForm.reset();
    this.mbiForm = this.createForm();
    this.errorMessage = '';
  }
}
