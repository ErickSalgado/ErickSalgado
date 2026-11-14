import { inject, Injectable } from '@angular/core';
import { FinancialProductRepository } from '../../domain/repositories/financial-product.repository';
import { HttpClient } from '@angular/common/http';
import {
  FinancialProduct,
  UpdateFinancialProductPayload,
} from '../../domain/models/financial-product.model';
import { map, Observable } from 'rxjs';
import {
  DeleteProductResponseDto,
  FinancialProductDto,
  ProductListResponseDto,
  ProductMutationResponseDto,
  UpdateFinancialProductDto,
} from '../dtos/financial-product.dto';
import { FinancialProductMapper } from '../mappers/financial-product.mapper';

@Injectable()
export class FinancialProductHttpRepository extends FinancialProductRepository {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = '/bp/products';

  override getAll(): Observable<FinancialProduct[]> {
    return this.httpClient
      .get<ProductListResponseDto>(this.baseUrl)
      .pipe(map((response) => response.data.map((dto) => FinancialProductMapper.toDomain(dto))));
  }

  override getById(productId: string): Observable<FinancialProduct> {
    const encodedId = encodeURIComponent(productId);
    return this.httpClient
      .get<FinancialProductDto>(`${this.baseUrl}/${encodedId}`)
      .pipe(map((dto) => FinancialProductMapper.toDomain(dto)));
  }
  override verifyIdExists(productId: string): Observable<boolean> {
    const encodedId = encodeURIComponent(productId.trim());
    return this.httpClient.get<boolean>(`${this.baseUrl}/verification/${encodedId}`);
  }
  override create(product: FinancialProduct): Observable<FinancialProduct> {
    const payload = FinancialProductMapper.toCreateDto(product);
    return this.httpClient
      .post<ProductMutationResponseDto<FinancialProductDto>>(this.baseUrl, payload)
      .pipe(map((response) => FinancialProductMapper.toDomain(response.data)));
  }
  override update(
    productId: string,
    product: UpdateFinancialProductPayload,
  ): Observable<FinancialProduct> {
    const encodedId = encodeURIComponent(productId);
    const payload = FinancialProductMapper.toUpdateDto(product);
    return this.httpClient
      .put<
        ProductMutationResponseDto<UpdateFinancialProductDto>
      >(`${this.baseUrl}/${encodedId}`, payload)
      .pipe(
        map((response) =>
          FinancialProductMapper.toDomain({
            id: productId,
            ...response.data,
          }),
        ),
      );
  }
  override delete(productId: string): Observable<void> {
    const encodedId = encodeURIComponent(productId);
    return this.httpClient
      .delete<DeleteProductResponseDto>(`${this.baseUrl}/${encodedId}`)
      .pipe(map(() => undefined));
  }
}
