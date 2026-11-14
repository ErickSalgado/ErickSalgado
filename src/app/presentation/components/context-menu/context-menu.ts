import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-context-menu',
  imports: [],
  templateUrl: './context-menu.html',
  styleUrl: './context-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextMenu {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly productName = input.required<string>();
  readonly editClicked = output<void>();
  readonly deleteClicked = output<void>();

  readonly isOpen = signal<boolean>(false);

  toggleMenu(): void {
    this.isOpen.update((open) => !open);
  }

  onEdit(): void {
    this.isOpen.set(false);
    this.editClicked.emit();
  }

  onDelete(): void {
    this.isOpen.set(false);
    this.deleteClicked.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) {
      return;
    }
    const clickedInside = this.elementRef.nativeElement.contains(event.target as Node);
    if (!clickedInside) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
    }
  }
}
