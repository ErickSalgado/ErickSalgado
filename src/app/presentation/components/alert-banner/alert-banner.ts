import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-alert-banner',
  imports: [],
  templateUrl: './alert-banner.html',
  styleUrl: './alert-banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertBanner {
  readonly message = input.required<string>();
  readonly dismissed = output<void>();

  onDismiss(): void {
    this.dismissed.emit();
  }
}
