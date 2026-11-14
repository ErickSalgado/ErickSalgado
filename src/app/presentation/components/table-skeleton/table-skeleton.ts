import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-table-skeleton',
  imports: [],
  templateUrl: './table-skeleton.html',
  styleUrl: './table-skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSkeleton {
  readonly rowCount = input<number>(5);

  readonly skeletonRows = computed(() =>
    Array.from({ length: Math.max(1, this.rowCount()) }, (_, index) => index),
  );
}
