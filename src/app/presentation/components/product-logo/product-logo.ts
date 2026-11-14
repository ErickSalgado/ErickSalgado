import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-product-logo',
  imports: [],
  templateUrl: './product-logo.html',
  styleUrl: './product-logo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductLogo {
  readonly logoUrl = input.required<string>();
  readonly productName = input.required<string>();

  private readonly failedUrl = signal<string | null>(null);

  readonly normalizedUrl = computed(() => this.logoUrl().trim());

  readonly shouldShowImage = computed(() => {
    const url = this.normalizedUrl();
    if (!url || this.failedUrl() === url) {
      return false;
    }
    return /^(https?:\/\/|data:image\/|\/|\.\/)/i.test(url);
  });

  readonly initials = computed(() => {
    const words = this.productName().trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return 'PR';
    }
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  });

  onImageError(): void {
    this.failedUrl.set(this.normalizedUrl());
  }
}
