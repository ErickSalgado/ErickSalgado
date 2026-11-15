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
import { Router, RouterLink } from '@angular/router';
import {
  FinancialProductFacade,
  PAGE_SIZE_OPTIONS,
  PageSizeOption,
} from '../../../application/facades/financial-product.facade';
import { FinancialProduct } from '../../../domain/models/financial-product.model';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';
import { ContextMenu } from '../../components/context-menu/context-menu';
import { ProductLogo } from '../../components/product-logo/product-logo';
import { TableSkeleton } from '../../components/table-skeleton/table-skeleton';
import { CalendarDatePipe } from '../../pipes/calendar-date.pipe';

@Component({
  selector: 'app-product-list',
  imports: [
    RouterLink,
    ConfirmModal,
    ContextMenu,
    ProductLogo,
    TableSkeleton,
    CalendarDatePipe,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductList implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly facade = inject(FinancialProductFacade);
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  readonly productPendingDelete = signal<FinancialProduct | null>(null);

  readonly deleteConfirmationMessage = computed(() => {
    const product = this.productPendingDelete();
    return product ? `¿Estás seguro de eliminar el producto ${product.name}?` : '';
  });

  readonly resultsSummaryText = computed(() => {
    const displayedCount = this.facade.paginatedProducts().length;
    const totalFiltered = this.facade.totalFilteredCount();

    if (totalFiltered > displayedCount) {
      return `${displayedCount} de ${totalFiltered} Resultados`;
    }

    return `${displayedCount} ${displayedCount === 1 ? 'Resultado' : 'Resultados'}`;
  });

  ngOnInit(): void {
    this.facade.loadProducts();
  }

  onSearchInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.facade.setSearchTerm(inputElement.value);
  }

  onPageSizeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedSize = Number(selectElement.value) as PageSizeOption;
    this.facade.setPageSize(selectedSize);
  }

  onPreviousPage(): void {
    this.facade.setPage(this.facade.currentPage() - 1);
  }

  onNextPage(): void {
    this.facade.setPage(this.facade.currentPage() + 1);
  }

  onEditProduct(productId: string): void {
    this.router.navigate(['/products/edit', productId]);
  }

  onRequestDelete(product: FinancialProduct): void {
    this.productPendingDelete.set(product);
  }

  onCancelDelete(): void {
    this.productPendingDelete.set(null);
  }

  onConfirmDelete(): void {
    const productToDelete = this.productPendingDelete();
    if (!productToDelete) {
      return;
    }

    this.facade
      .deleteProduct(productToDelete.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((wasDeleted) => {
        if (wasDeleted) {
          this.productPendingDelete.set(null);
        }
      });
  }
}
