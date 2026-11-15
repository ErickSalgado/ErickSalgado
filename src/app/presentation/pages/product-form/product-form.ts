import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FinancialProductFacade } from '../../../application/facades/financial-product.facade';
import {
  PRODUCT_VALIDATION_RULES,
  addOneYearToIsoDate,
  createUniqueProductIdValidator,
  getTodayIsoDate,
  minTodayDateValidator,
  revisionDateMatchesReleaseValidator,
} from '../../../application/validators/financial-product.validators';
import { FinancialProduct } from '../../../domain/models/financial-product.model';
import { FinancialProductRepository } from '../../../domain/repositories/financial-product.repository';

type ProductFormField = 'id' | 'name' | 'description' | 'logo' | 'releaseDate' | 'revisionDate';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductForm implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly repository = inject(FinancialProductRepository);
  readonly facade = inject(FinancialProductFacade);

  readonly todayIsoDate = getTodayIsoDate();
  readonly isEditMode = signal<boolean>(false);
  readonly isNotFound = signal<boolean>(false);
  readonly hasSubmitted = signal<boolean>(false);

  private initialEditProduct: FinancialProduct | null = null;

  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Formulario de Edición' : 'Formulario de Registro',
  );

  readonly productForm = this.formBuilder.nonNullable.group(
    {
      id: [
        '',
        [
          Validators.required,
          Validators.minLength(PRODUCT_VALIDATION_RULES.idMinLength),
          Validators.maxLength(PRODUCT_VALIDATION_RULES.idMaxLength),
        ],
        [createUniqueProductIdValidator(this.repository)],
      ],
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(PRODUCT_VALIDATION_RULES.nameMinLength),
          Validators.maxLength(PRODUCT_VALIDATION_RULES.nameMaxLength),
        ],
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(PRODUCT_VALIDATION_RULES.descriptionMinLength),
          Validators.maxLength(PRODUCT_VALIDATION_RULES.descriptionMaxLength),
        ],
      ],
      logo: ['', [Validators.required]],
      releaseDate: ['', [Validators.required, minTodayDateValidator()]],
      revisionDate: [{ value: '', disabled: true }, [Validators.required]],
    },
    {
      validators: [revisionDateMatchesReleaseValidator()],
    },
  );

  ngOnInit(): void {
    this.facade.clearError();
    this.setupReleaseDateAutoCalculation();

    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.initializeEditMode(productId);
    }
  }

  hasFieldError(fieldName: ProductFormField): boolean {
    const control = this.productForm.controls[fieldName];
    const hasControlError =
      control.invalid && (control.touched || control.dirty || this.hasSubmitted());

    if (fieldName === 'revisionDate') {
      const hasMismatch =
        this.productForm.hasError('revisionDateMismatch') &&
        (this.productForm.controls.releaseDate.touched || this.hasSubmitted());
      return hasControlError || hasMismatch;
    }

    return hasControlError;
  }

  isIdVerificationPending(): boolean {
    return !this.isEditMode() && this.productForm.controls.id.pending;
  }

  getFieldErrorMessage(fieldName: ProductFormField): string | null {
    if (!this.hasFieldError(fieldName)) {
      return null;
    }

    const control = this.productForm.controls[fieldName];

    if (control.hasError('required')) {
      return 'Este campo es requerido!';
    }

    const minError = control.getError('minlength') as { requiredLength: number } | null;
    if (minError) {
      return fieldName === 'id'
        ? `ID no válido! Mínimo ${minError.requiredLength} caracteres.`
        : `Mínimo ${minError.requiredLength} caracteres.`;
    }

    const maxError = control.getError('maxlength') as { requiredLength: number } | null;
    if (maxError) {
      return `Máximo ${maxError.requiredLength} caracteres.`;
    }

    if (control.hasError('idAlreadyExists')) {
      return 'ID no válido!';
    }

    if (control.hasError('idVerificationFailed')) {
      return 'No se pudo verificar la disponibilidad del ID.';
    }

    if (control.hasError('invalidDateFormat') || control.hasError('minTodayDate')) {
      return 'La fecha debe ser igual o mayor a la fecha actual!';
    }

    if (fieldName === 'revisionDate' && this.productForm.hasError('revisionDateMismatch')) {
      return 'La fecha de revisión debe ser exactamente un año posterior!';
    }

    return null;
  }

  onReset(): void {
    this.facade.clearError();
    this.hasSubmitted.set(false);

    const preservedId = this.isEditMode() ? (this.initialEditProduct?.id ?? '') : '';

    this.productForm.reset({
      id: preservedId,
      name: '',
      description: '',
      logo: '',
      releaseDate: '',
      revisionDate: '',
    });
  }

  onSubmit(): void {
    this.hasSubmitted.set(true);
    this.productForm.markAllAsTouched();

    if (this.productForm.invalid || this.productForm.pending || this.facade.isSubmitting()) {
      return;
    }

    const rawProduct = this.productForm.getRawValue();
    const { id, ...updatePayload } = rawProduct;

    const saveRequest$ =
      this.isEditMode() && this.initialEditProduct
        ? this.facade.updateProduct(this.initialEditProduct.id, updatePayload)
        : this.facade.createProduct(rawProduct);

    saveRequest$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((wasSaved) => {
      if (wasSaved) {
        this.router.navigate(['/products']);
      }
    });
  }

  private setupReleaseDateAutoCalculation(): void {
    this.productForm.controls.releaseDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((releaseDateValue) => {
        const computedRevision = addOneYearToIsoDate(releaseDateValue);
        this.productForm.controls.revisionDate.setValue(computedRevision, { emitEvent: false });
        this.productForm.updateValueAndValidity({ emitEvent: false });
      });
  }

  private initializeEditMode(productId: string): void {
    this.isEditMode.set(true);
    const idControl = this.productForm.controls.id;
    idControl.clearAsyncValidators();
    idControl.disable({ emitEvent: false });

    this.facade
      .getProductById(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((product) => {
        if (!product) {
          this.isNotFound.set(true);
          return;
        }

        this.initialEditProduct = product;
        this.productForm.patchValue(product, { emitEvent: false });
        const computedRevision = addOneYearToIsoDate(product.releaseDate);
        this.productForm.controls.revisionDate.setValue(computedRevision || product.revisionDate, {
          emitEvent: false,
        });
        this.productForm.updateValueAndValidity();
      });
  }
}
