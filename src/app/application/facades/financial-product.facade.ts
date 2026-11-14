import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { AppError } from '../../core/models/app-error.model';
import {
  FinancialProduct,
  UpdateFinancialProductPayload,
} from '../../domain/models/financial-product.model';
import { FinancialProductRepository } from '../../domain/repositories/financial-product.repository';

export const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

@Injectable({
  providedIn: 'root',
})
export class FinancialProductFacade {
  private readonly repository = inject(FinancialProductRepository);

  private readonly _products = signal<FinancialProduct[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _isSubmitting = signal<boolean>(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _searchTerm = signal<string>('');
  private readonly _pageSize = signal<PageSizeOption>(5);
  private readonly _requestedPage = signal<number>(1);

  readonly products = this._products.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();

  readonly filteredProducts = computed<FinancialProduct[]>(() => {
    const normalizedTerm = this._searchTerm().trim().toLowerCase();
    const allProducts = this._products();

    if (!normalizedTerm) {
      return allProducts;
    }

    return allProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(normalizedTerm) ||
        product.description.toLowerCase().includes(normalizedTerm) ||
        product.id.toLowerCase().includes(normalizedTerm),
    );
  });

  readonly totalFilteredCount = computed<number>(() => this.filteredProducts().length);

  readonly totalPages = computed<number>(() => {
    const total = this.totalFilteredCount();
    return Math.max(1, Math.ceil(total / this._pageSize()));
  });

  readonly currentPage = computed<number>(() => {
    return Math.min(Math.max(1, this._requestedPage()), this.totalPages());
  });

  readonly paginatedProducts = computed<FinancialProduct[]>(() => {
    const size = this._pageSize();
    const startIndex = (this.currentPage() - 1) * size;
    return this.filteredProducts().slice(startIndex, startIndex + size);
  });

  loadProducts(): void {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    this.repository
      .getAll()
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (products) => {
          this._products.set(products);
        },
        error: (error: unknown) => {
          this._errorMessage.set(this.extractErrorMessage(error));
        },
      });
  }

  getProductById(productId: string): Observable<FinancialProduct | null> {
    const cachedProduct = this._products().find((product) => product.id === productId);
    if (cachedProduct) {
      return of(cachedProduct);
    }

    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.repository.getById(productId).pipe(
      catchError((error: unknown) => {
        this._errorMessage.set(this.extractErrorMessage(error));
        return of(null);
      }),
      finalize(() => this._isLoading.set(false)),
    );
  }

  createProduct(product: FinancialProduct): Observable<boolean> {
    this._isSubmitting.set(true);
    this._errorMessage.set(null);

    return this.repository.create(product).pipe(
      tap((createdProduct) => {
        this._products.update((currentProducts) => [...currentProducts, createdProduct]);
      }),
      map(() => true),
      catchError((error: unknown) => {
        this._errorMessage.set(this.extractErrorMessage(error));
        return of(false);
      }),
      finalize(() => this._isSubmitting.set(false)),
    );
  }

  updateProduct(productId: string, payload: UpdateFinancialProductPayload): Observable<boolean> {
    this._isSubmitting.set(true);
    this._errorMessage.set(null);

    return this.repository.update(productId, payload).pipe(
      tap((updatedProduct) => {
        this._products.update((currentProducts) =>
          currentProducts.map((product) => (product.id === productId ? updatedProduct : product)),
        );
      }),
      map(() => true),
      catchError((error: unknown) => {
        this._errorMessage.set(this.extractErrorMessage(error));
        return of(false);
      }),
      finalize(() => this._isSubmitting.set(false)),
    );
  }

  deleteProduct(productId: string): Observable<boolean> {
    this._isSubmitting.set(true);
    this._errorMessage.set(null);

    return this.repository.delete(productId).pipe(
      tap(() => {
        this._products.update((currentProducts) =>
          currentProducts.filter((product) => product.id !== productId),
        );
      }),
      map(() => true),
      catchError((error: unknown) => {
        this._errorMessage.set(this.extractErrorMessage(error));
        return of(false);
      }),
      finalize(() => this._isSubmitting.set(false)),
    );
  }

  setSearchTerm(term: string): void {
    this._searchTerm.set(term);
    this._requestedPage.set(1);
  }

  setPageSize(size: PageSizeOption): void {
    this._pageSize.set(size);
    this._requestedPage.set(1);
  }

  setPage(page: number): void {
    const clampedPage = Math.min(Math.max(1, page), this.totalPages());
    this._requestedPage.set(clampedPage);
  }

  clearError(): void {
    this._errorMessage.set(null);
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof AppError) {
      return error.userMessage;
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'Ocurrió un error inesperado al procesar la operación.';
  }
}
