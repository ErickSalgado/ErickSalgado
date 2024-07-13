import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-list-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './list-products.component.html',
  styleUrl: './list-products.component.css',
  providers: [ProductService],
})
export class ListProductsComponent {
  products: any[] = [];
  filteredProducts: any[] = [];
  searchTerm: string = '';
  itemsPerPage: number = 5;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe(
      (data: any) => {
        this.products = data.data;
        this.filterProducts();
      },
      (error) => console.error('Error loading products:', error)
    );
  }

  filterProducts(): void {
    this.filteredProducts = this.products.filter(
      (product) =>
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) || 
          product.date_release.includes(this.searchTerm) || 
          product.date_revision.includes(this.searchTerm)
          
    );
  }

  onSearch(): void {
    this.filterProducts();
  }

  onItemsPerPageChange(value: number): void {
    this.itemsPerPage = value;
  }
}
