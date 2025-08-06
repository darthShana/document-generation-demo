import { TestBed } from '@angular/core/testing';

import { DocumentGenerator } from './document-generator';

describe('DocumentGenerator', () => {
  let service: DocumentGenerator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentGenerator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
