import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  imports: [],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmModal {
  readonly isOpen = input.required<boolean>();
  readonly message = input.required<string>();
  readonly cancelLabel = input<string>('Cancelar');
  readonly confirmLabel = input<string>('Eliminar');
  readonly isProcessing = input<boolean>(false);

  readonly cancelled = output<void>();
  readonly confirmed = output<void>();

  onCancel(): void {
    if (!this.isProcessing()) {
      this.cancelled.emit();
    }
  }

  onConfirm(): void {
    if (!this.isProcessing()) {
      this.confirmed.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.onCancel();
    }
  }
}
