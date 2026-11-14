import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductLogo } from './product-logo';

describe('ProductLogo', () => {
  let component: ProductLogo;
  let fixture: ComponentFixture<ProductLogo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductLogo],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductLogo);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('logoUrl', 'https://example.com/visa.png');
    fixture.componentRef.setInput('productName', 'Tarjetas de Crédito');
    fixture.detectChanges();
  });

  it('should render image when logoUrl is a valid URL', () => {
    const imageElement = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
    expect(component).toBeTruthy();
    expect(imageElement).not.toBeNull();
    expect(imageElement?.getAttribute('alt')).toBe('Logo de Tarjetas de Crédito');
  });

  it('should fallback to two-letter initials when image fails to load', () => {
    const imageElement = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    imageElement.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const initialsElement = fixture.nativeElement.querySelector('.product-logo__initials');
    expect(initialsElement?.textContent?.trim()).toBe('TC');
  });

  it('should show initials immediately for non-URL logo values and single/empty names', () => {
    fixture.componentRef.setInput('logoUrl', 'assets-1.png');
    fixture.componentRef.setInput('productName', 'Cuenta');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('CU');

    fixture.componentRef.setInput('productName', '   ');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('PR');
  });
});
