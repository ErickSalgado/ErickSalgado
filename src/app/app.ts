import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FinancialProductFacade } from './application/facades/financial-product.facade';
import { AlertBanner } from './presentation/components/alert-banner/alert-banner';
import { Header } from './presentation/layout/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, AlertBanner],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly facade = inject(FinancialProductFacade);
}
