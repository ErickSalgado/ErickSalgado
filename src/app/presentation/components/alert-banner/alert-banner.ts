import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NotificationType } from '../../../application/facades/financial-product.facade';

@Component({
  selector: 'app-alert-banner',
  imports: [],
  templateUrl: './alert-banner.html',
  styleUrl: './alert-banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertBanner {
  readonly message = input.required<string>();
  readonly type = input<NotificationType>('error');
  readonly dismissed = output<void>();

  onDismiss(): void {
    this.dismissed.emit();
  }
}
