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
export type NotificationType = 'success' | 'error';

export interface AppNotification {
  type: NotificationType;
  message: string;
}

const SUCCESS_TOAST_DURATION_MS = 3000;
const ERROR_TOAST_DURATION_MS = 6000;

@Injectable({
  providedIn: 'root',
})
export class FinancialProductFacade {
  private readonly repository = inject(FinancialProductRepository);
  private notificationTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly _products = signal<FinancialProduct[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _isSubmitting = signal<boolean>(false);
  private readonly _notification = signal<AppNotification | null>(null);
  private readonly _searchTerm = signal<string>('');
  private readonly _pageSize = signal<PageSizeOption>(5);
  private readonly _requestedPage = signal<number>(1);

  readonly products = this._products.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly notification = this._notification.asReadonly();
  readonly errorMessage = computed(() => {
    const current = this._notification();
    return current?.type === 'error' ? current.message : null;
  });
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
    this.clearError();

    this.repository
      .getAll()
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (products) => {
          this._products.set(products);
        },
        error: (error: unknown) => {
          this.showError(error);
        },
      });
  }

  getProductById(productId: string): Observable<FinancialProduct | null> {
    const cachedProduct = this._products().find((product) => product.id === productId);
    if (cachedProduct) {
      return of(cachedProduct);
    }

    this._isLoading.set(true);
    this.clearError();

    return this.repository.getById(productId).pipe(
      catchError((error: unknown) => {
        this.showError(error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false)),
    );
  }

  createProduct(product: FinancialProduct): Observable<boolean> {
    return this.runMutation(
      this.repository.create(product),
      (createdProduct) => {
        this._products.update((currentProducts) => [...currentProducts, createdProduct]);
      },
      'Producto creado correctamente.',
    );
  }

  updateProduct(productId: string, payload: UpdateFinancialProductPayload): Observable<boolean> {
    return this.runMutation(
      this.repository.update(productId, payload),
      (updatedProduct) => {
        this._products.update((currentProducts) =>
          currentProducts.map((product) => (product.id === productId ? updatedProduct : product)),
        );
      },
      'Producto actualizado correctamente.',
    );
  }

  deleteProduct(productId: string): Observable<boolean> {
    return this.runMutation(
      this.repository.delete(productId),
      () => {
        this._products.update((currentProducts) =>
          currentProducts.filter((product) => product.id !== productId),
        );
      },
      'Producto eliminado correctamente.',
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

  clearNotification(): void {
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
      this.notificationTimer = null;
    }
    this._notification.set(null);
  }

  clearError(): void {
    if (this._notification()?.type === 'error') {
      this.clearNotification();
    }
  }

  private runMutation<TResult>(
    request$: Observable<TResult>,
    onSuccess: (result: TResult) => void,
    successMessage: string,
  ): Observable<boolean> {
    this._isSubmitting.set(true);
    this.clearError();

    return request$.pipe(
      tap((result) => {
        onSuccess(result);
        this.showNotification('success', successMessage);
      }),
      map(() => true),
      catchError((error: unknown) => {
        this.showError(error);
        return of(false);
      }),
      finalize(() => this._isSubmitting.set(false)),
    );
  }

  private showError(error: unknown): void {
    this.showNotification('error', this.extractErrorMessage(error));
  }

  private showNotification(type: NotificationType, message: string): void {
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
    }

    const durationMs = type === 'error' ? ERROR_TOAST_DURATION_MS : SUCCESS_TOAST_DURATION_MS;
    this._notification.set({ type, message });
    this.notificationTimer = setTimeout(() => {
      this.notificationTimer = null;
      this._notification.set(null);
    }, durationMs);
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
