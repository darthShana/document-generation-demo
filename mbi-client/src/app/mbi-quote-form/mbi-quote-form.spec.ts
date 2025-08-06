import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MbiQuoteForm } from './mbi-quote-form';

describe('MbiQuoteForm', () => {
  let component: MbiQuoteForm;
  let fixture: ComponentFixture<MbiQuoteForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MbiQuoteForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MbiQuoteForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
