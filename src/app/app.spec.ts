import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FinancialProductRepository } from './domain/repositories/financial-product.repository';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: FinancialProductRepository,
          useValue: {
            getAll: jest.fn().mockReturnValue(of([])),
            getById: jest.fn(),
            verifyIdExists: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn().mockReturnValue(of(undefined)),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the bank header, router outlet and active toast notification', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).not.toBeNull();
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
    expect(compiled.querySelector('app-alert-banner')).toBeNull();

    app.facade.deleteProduct('id-1').subscribe();
    fixture.detectChanges();
    expect(compiled.querySelector('app-alert-banner')?.textContent).toContain(
      'Producto eliminado correctamente.',
    );

    const closeButton = compiled.querySelector('.alert-banner__close') as HTMLButtonElement;
    closeButton.click();
    fixture.detectChanges();
    expect(compiled.querySelector('app-alert-banner')).toBeNull();
  });
});
