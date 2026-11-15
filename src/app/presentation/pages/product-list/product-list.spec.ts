import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FinancialProduct } from '../../../domain/models/financial-product.model';
import { FinancialProductRepository } from '../../../domain/repositories/financial-product.repository';
import { ProductList } from './product-list';

function buildProducts(count: number): FinancialProduct[] {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    return {
      id: `id-${number}`,
      name: `Producto ${number}`,
      description: `Descripción completa producto ${number}`,
      logo: 'logo.png',
      releaseDate: '2026-12-01',
      revisionDate: '2027-12-01',
    };
  });
}

describe('ProductList', () => {
  let component: ProductList;
  let fixture: ComponentFixture<ProductList>;
  let router: Router;
  let repositoryMock: jest.Mocked<FinancialProductRepository>;

  beforeEach(async () => {
    repositoryMock = {
      getAll: jest.fn().mockReturnValue(of(buildProducts(7))),
      getById: jest.fn(),
      verifyIdExists: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [ProductList],
      providers: [
        provideRouter([]),
        {
          provide: FinancialProductRepository,
          useValue: repositoryMock,
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ProductList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load products on init and render first page of 5 results', () => {
    const tableRows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(component).toBeTruthy();
    expect(repositoryMock.getAll).toHaveBeenCalledTimes(1);
    expect(tableRows.length).toBe(5);
    expect(component.resultsSummaryText()).toBe('5 de 7 Resultados');
  });

  it('should filter products when typing in search input', () => {
    const searchInput = fixture.nativeElement.querySelector(
      '.products-toolbar__search',
    ) as HTMLInputElement;
    searchInput.value = 'Producto 7';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const tableRows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(tableRows.length).toBe(1);
    expect(component.resultsSummaryText()).toBe('1 Resultado');
  });

  it('should change page size and navigate between pages', () => {
    component.onNextPage();
    fixture.detectChanges();
    expect(component.facade.currentPage()).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);

    component.onPreviousPage();
    fixture.detectChanges();
    expect(component.facade.currentPage()).toBe(1);

    const pageSelect = fixture.nativeElement.querySelector(
      '.products-footer__select',
    ) as HTMLSelectElement;
    pageSelect.value = '10';
    pageSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.facade.pageSize()).toBe(10);
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(7);
  });

  it('should navigate to edit page when edit action is triggered', () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onEditProduct('id-1');

    expect(navigateSpy).toHaveBeenCalledWith(['/products/edit', 'id-1']);
  });

  it('should open, cancel and confirm product deletion', () => {
    const targetProduct = component.facade.products()[0];

    component.onRequestDelete(targetProduct);
    fixture.detectChanges();
    expect(component.deleteConfirmationMessage()).toContain(targetProduct.name);

    component.onCancelDelete();
    expect(component.productPendingDelete()).toBeNull();

    component.onRequestDelete(targetProduct);
    component.onConfirmDelete();

    expect(repositoryMock.delete).toHaveBeenCalledWith(targetProduct.id);
    expect(component.productPendingDelete()).toBeNull();
    expect(component.facade.products().length).toBe(6);
  });
});
