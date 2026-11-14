import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AppError } from '../../core/models/app-error.model';
import {
  FinancialProduct,
  UpdateFinancialProductPayload,
} from '../../domain/models/financial-product.model';
import { FinancialProductRepository } from '../../domain/repositories/financial-product.repository';
import { FinancialProductFacade } from './financial-product.facade';

function buildSampleProducts(count: number): FinancialProduct[] {
  return Array.from({ length: count }, (_, index) => {
    const productNumber = index + 1;
    return {
      id: `prod-${productNumber}`,
      name: `Producto Financiero ${productNumber}`,
      description: `Descripción detallada del producto ${productNumber}`,
      logo: `https://example.com/logo-${productNumber}.png`,
      releaseDate: '2026-12-01',
      revisionDate: '2027-12-01',
    };
  });
}

describe('FinancialProductFacade', () => {
  let facade: FinancialProductFacade;
  let repositoryMock: jest.Mocked<FinancialProductRepository>;

  beforeEach(() => {
    repositoryMock = {
      getAll: jest.fn(),
      getById: jest.fn(),
      verifyIdExists: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        FinancialProductFacade,
        {
          provide: FinancialProductRepository,
          useValue: repositoryMock,
        },
      ],
    });

    facade = TestBed.inject(FinancialProductFacade);
  });

  it('should load products successfully and reset loading flag', () => {
    const sampleProducts = buildSampleProducts(3);
    repositoryMock.getAll.mockReturnValue(of(sampleProducts));

    facade.loadProducts();

    expect(repositoryMock.getAll).toHaveBeenCalledTimes(1);
    expect(facade.products()).toEqual(sampleProducts);
    expect(facade.isLoading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  it('should expose friendly error message when loadProducts fails', () => {
    repositoryMock.getAll.mockReturnValue(
      throwError(() => new AppError(500, 'Error al consultar productos')),
    );

    facade.loadProducts();

    expect(facade.errorMessage()).toBe('Error al consultar productos');
    expect(facade.isLoading()).toBe(false);

    facade.clearError();
    expect(facade.errorMessage()).toBeNull();
  });

  it('should handle generic and unknown errors gracefully', () => {
    repositoryMock.getAll.mockReturnValueOnce(throwError(() => new Error('Fallo genérico')));
    facade.loadProducts();
    expect(facade.errorMessage()).toBe('Fallo genérico');

    repositoryMock.getAll.mockReturnValueOnce(throwError(() => 'error-no-tipado'));
    facade.loadProducts();
    expect(facade.errorMessage()).toBe('Ocurrió un error inesperado al procesar la operación.');
  });

  it('should filter products by name, description or id and reset page to 1', () => {
    const sampleProducts: FinancialProduct[] = [
      {
        id: 'trj-crd',
        name: 'Tarjetas de Crédito',
        description: 'Consumo mensual diferido',
        logo: 'visa.png',
        releaseDate: '2026-12-01',
        revisionDate: '2027-12-01',
      },
      {
        id: 'cta-ahr',
        name: 'Cuenta de Ahorros',
        description: 'Rendimiento anual garantizado',
        logo: 'ahorro.png',
        releaseDate: '2026-12-01',
        revisionDate: '2027-12-01',
      },
      ...buildSampleProducts(5),
    ];
    repositoryMock.getAll.mockReturnValue(of(sampleProducts));
    facade.loadProducts();
    facade.setPage(2);

    facade.setSearchTerm('ahorros');
    expect(facade.currentPage()).toBe(1);
    expect(facade.filteredProducts().map((product) => product.id)).toEqual(['cta-ahr']);

    facade.setSearchTerm('diferido');
    expect(facade.filteredProducts().map((product) => product.id)).toEqual(['trj-crd']);

    facade.setSearchTerm('TRJ-CRD');
    expect(facade.filteredProducts().map((product) => product.id)).toEqual(['trj-crd']);

    facade.setSearchTerm('');
    expect(facade.totalFilteredCount()).toBe(7);
  });

  it('should paginate products and clamp pages safely', () => {
    const sampleProducts = buildSampleProducts(12);
    repositoryMock.getAll.mockReturnValue(of(sampleProducts));
    facade.loadProducts();

    expect(facade.pageSize()).toBe(5);
    expect(facade.totalPages()).toBe(3);
    expect(facade.paginatedProducts()).toHaveLength(5);

    facade.setPage(3);
    expect(facade.currentPage()).toBe(3);
    expect(facade.paginatedProducts().map((product) => product.id)).toEqual(['prod-11', 'prod-12']);

    facade.setPage(99);
    expect(facade.currentPage()).toBe(3);

    facade.setPageSize(10);
    expect(facade.currentPage()).toBe(1);
    expect(facade.totalPages()).toBe(2);
    expect(facade.paginatedProducts()).toHaveLength(10);
  });

  it('should return cached product in getProductById without calling repository', () => {
    const sampleProducts = buildSampleProducts(2);
    repositoryMock.getAll.mockReturnValue(of(sampleProducts));
    facade.loadProducts();

    let resolvedProduct: FinancialProduct | null | undefined;
    facade.getProductById('prod-2').subscribe((product) => {
      resolvedProduct = product;
    });

    expect(resolvedProduct).toEqual(sampleProducts[1]);
    expect(repositoryMock.getById).not.toHaveBeenCalled();
  });

  it('should fetch product from repository on cache miss and handle 404 errors', () => {
    const remoteProduct = buildSampleProducts(1)[0];
    repositoryMock.getById.mockReturnValueOnce(of(remoteProduct));

    let resolvedProduct: FinancialProduct | null | undefined;
    facade.getProductById('prod-1').subscribe((product) => {
      resolvedProduct = product;
    });

    expect(repositoryMock.getById).toHaveBeenCalledWith('prod-1');
    expect(resolvedProduct).toEqual(remoteProduct);

    repositoryMock.getById.mockReturnValueOnce(
      throwError(() => new AppError(404, 'Producto no encontrado')),
    );
    facade.getProductById('missing').subscribe((product) => {
      resolvedProduct = product;
    });

    expect(resolvedProduct).toBeNull();
    expect(facade.errorMessage()).toBe('Producto no encontrado');
  });

  it('should create, update and delete products updating local state', () => {
    const initialProduct = buildSampleProducts(1)[0];
    const createdProduct: FinancialProduct = {
      ...initialProduct,
      id: 'nuevo-1',
      name: 'Nuevo Producto',
    };
    const updatePayload: UpdateFinancialProductPayload = {
      name: 'Producto Editado',
      description: 'Descripción editada completa',
      logo: 'edited.png',
      releaseDate: '2026-12-10',
      revisionDate: '2027-12-10',
    };

    repositoryMock.getAll.mockReturnValue(of([initialProduct]));
    facade.loadProducts();

    repositoryMock.create.mockReturnValue(of(createdProduct));
    let createSuccess = false;
    facade.createProduct(createdProduct).subscribe((result) => {
      createSuccess = result;
    });
    expect(createSuccess).toBe(true);
    expect(facade.products()).toHaveLength(2);

    repositoryMock.update.mockReturnValue(of({ id: 'nuevo-1', ...updatePayload }));
    let updateSuccess = false;
    facade.updateProduct('nuevo-1', updatePayload).subscribe((result) => {
      updateSuccess = result;
    });
    expect(updateSuccess).toBe(true);
    expect(facade.products().find((product) => product.id === 'nuevo-1')?.name).toBe(
      'Producto Editado',
    );

    repositoryMock.delete.mockReturnValue(of(undefined));
    let deleteSuccess = false;
    facade.deleteProduct('nuevo-1').subscribe((result) => {
      deleteSuccess = result;
    });
    expect(deleteSuccess).toBe(true);
    expect(facade.products().map((product) => product.id)).toEqual(['prod-1']);
  });

  it('should return false and set errorMessage when create, update or delete fails', () => {
    const sampleProduct = buildSampleProducts(1)[0];

    repositoryMock.create.mockReturnValue(
      throwError(() => new AppError(400, 'ID duplicado en base de datos')),
    );
    let actionResult = true;
    facade.createProduct(sampleProduct).subscribe((result) => {
      actionResult = result;
    });
    expect(actionResult).toBe(false);
    expect(facade.errorMessage()).toBe('ID duplicado en base de datos');

    repositoryMock.update.mockReturnValue(
      throwError(() => new AppError(404, 'No existe para actualizar')),
    );
    actionResult = true;
    facade.updateProduct('prod-1', sampleProduct).subscribe((result) => {
      actionResult = result;
    });
    expect(actionResult).toBe(false);
    expect(facade.errorMessage()).toBe('No existe para actualizar');

    repositoryMock.delete.mockReturnValue(
      throwError(() => new AppError(404, 'No existe para eliminar')),
    );
    actionResult = true;
    facade.deleteProduct('prod-1').subscribe((result) => {
      actionResult = result;
    });
    expect(actionResult).toBe(false);
    expect(facade.errorMessage()).toBe('No existe para eliminar');
  });
});
