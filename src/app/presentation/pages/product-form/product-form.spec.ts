import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AppError } from '../../../core/models/app-error.model';
import { getTodayIsoDate } from '../../../application/validators/financial-product.validators';
import { FinancialProduct } from '../../../domain/models/financial-product.model';
import { FinancialProductRepository } from '../../../domain/repositories/financial-product.repository';
import { ProductForm } from './product-form';

describe('ProductForm', () => {
  let component: ProductForm;
  let fixture: ComponentFixture<ProductForm>;
  let router: Router;
  let repositoryMock: jest.Mocked<FinancialProductRepository>;

  const sampleProduct: FinancialProduct = {
    id: 'trj-crd',
    name: 'Tarjetas de Crédito',
    description: 'Tarjeta de consumo bajo la modalidad de crédito',
    logo: 'https://example.com/visa.png',
    releaseDate: '2099-05-10',
    revisionDate: '2100-05-10',
  };

  async function setupTestingModule(routeProductId: string | null = null): Promise<void> {
    repositoryMock = {
      getAll: jest.fn().mockReturnValue(of([])),
      getById: jest.fn().mockReturnValue(of(sampleProduct)),
      verifyIdExists: jest.fn().mockReturnValue(of(false)),
      create: jest.fn().mockReturnValue(of(sampleProduct)),
      update: jest.fn().mockReturnValue(of(sampleProduct)),
      delete: jest.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [ProductForm],
      providers: [
        provideRouter([]),
        {
          provide: FinancialProductRepository,
          useValue: repositoryMock,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(routeProductId ? { id: routeProductId } : {}),
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('create mode', () => {
    beforeEach(async () => {
      jest.useFakeTimers();
      await setupTestingModule(null);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should render Formulario de Registro and auto-calculate revisionDate', () => {
      expect(component.pageTitle()).toBe('Formulario de Registro');
      expect(component.productForm.controls.revisionDate.disabled).toBe(true);

      const today = getTodayIsoDate();
      component.productForm.controls.releaseDate.setValue(today);

      const expectedYear = Number(today.slice(0, 4)) + 1;
      expect(component.productForm.controls.revisionDate.value.startsWith(`${expectedYear}-`)).toBe(
        true,
      );
    });

    it('should display validation errors when fields are touched or invalid', () => {
      component.onSubmit();
      fixture.detectChanges();

      expect(component.getFieldErrorMessage('id')).toBe('Este campo es requerido!');

      component.productForm.controls.id.setValue('ab');
      expect(component.getFieldErrorMessage('id')).toBe('ID no válido! Mínimo 3 caracteres.');

      component.productForm.controls.name.setValue('Corto');
      component.productForm.controls.name.markAsTouched();
      expect(component.getFieldErrorMessage('name')).toBe('Mínimo 6 caracteres.');

      component.productForm.controls.releaseDate.setValue('2020-01-01');
      component.productForm.controls.releaseDate.markAsTouched();
      expect(component.getFieldErrorMessage('releaseDate')).toBe(
        'La fecha debe ser igual o mayor a la fecha actual!',
      );
    });

    it('should reset form values on Reiniciar and submit valid product', () => {
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

      component.productForm.patchValue({
        id: 'trj-oro',
        name: 'Tarjeta Oro',
        description: 'Tarjeta con beneficios exclusivos',
        logo: 'https://example.com/oro.png',
        releaseDate: '2099-05-10',
      });
      jest.advanceTimersByTime(300);

      component.onReset();
      expect(component.productForm.controls.id.value).toBe('');
      expect(component.productForm.controls.revisionDate.disabled).toBe(true);

      component.productForm.patchValue({
        id: 'trj-crd',
        name: 'Tarjetas de Crédito',
        description: 'Tarjeta de consumo bajo la modalidad de crédito',
        logo: 'https://example.com/visa.png',
        releaseDate: '2099-05-10',
      });
      jest.advanceTimersByTime(300);

      component.onSubmit();

      expect(repositoryMock.create).toHaveBeenCalledWith(sampleProduct);
      expect(navigateSpy).toHaveBeenCalledWith(['/products']);
    });
  });

  describe('edit mode', () => {
    it('should load product with disabled ID, clear editable fields on reset while keeping ID, and update on submit', async () => {
      await setupTestingModule('trj-crd');
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

      expect(component.pageTitle()).toBe('Formulario de Edición');
      expect(component.productForm.controls.id.disabled).toBe(true);
      expect(component.productForm.controls.name.value).toBe(sampleProduct.name);

      component.onReset();
      expect(component.productForm.controls.id.value).toBe('trj-crd');
      expect(component.productForm.controls.id.disabled).toBe(true);
      expect(component.productForm.controls.name.value).toBe('');
      expect(component.productForm.controls.description.value).toBe('');
      expect(component.productForm.controls.logo.value).toBe('');
      expect(component.productForm.controls.releaseDate.value).toBe('');
      expect(component.productForm.controls.revisionDate.value).toBe('');

      component.productForm.patchValue({
        name: 'Tarjeta Actualizada',
        description: sampleProduct.description,
        logo: sampleProduct.logo,
        releaseDate: sampleProduct.releaseDate,
      });
      component.onSubmit();

      expect(repositoryMock.update).toHaveBeenCalledWith('trj-crd', {
        name: 'Tarjeta Actualizada',
        description: sampleProduct.description,
        logo: sampleProduct.logo,
        releaseDate: sampleProduct.releaseDate,
        revisionDate: sampleProduct.revisionDate,
      });
      expect(navigateSpy).toHaveBeenCalledWith(['/products']);
    });

    it('should mark isNotFound when repository returns 404 for missing id', async () => {
      await setupTestingModule('unknown-id');
      repositoryMock.getById.mockReturnValueOnce(
        throwError(() => new AppError(404, 'No encontrado')),
      );

      component.ngOnInit();

      expect(component.isNotFound()).toBe(true);
    });
  });
});
