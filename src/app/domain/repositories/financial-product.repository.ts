import { Observable } from 'rxjs';
import {
  FinancialProduct,
  UpdateFinancialProductPayload,
} from '../models/financial-product.model';

export abstract class FinancialProductRepository {
    abstract getAll(): Observable<FinancialProduct[]>;
    abstract getById(productId: string): Observable<FinancialProduct>;
    abstract verifyIdExists(productId: string): Observable<boolean>;
    abstract create(product: FinancialProduct): Observable<FinancialProduct>;
    abstract update(productId: string, product: UpdateFinancialProductPayload): Observable<FinancialProduct>;
    abstract delete(productId: string): Observable<void>;
}