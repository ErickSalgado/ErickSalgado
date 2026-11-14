import {
  FinancialProduct,
  UpdateFinancialProductPayload,
} from '../../domain/models/financial-product.model';
import { FinancialProductDto, UpdateFinancialProductDto } from '../dtos/financial-product.dto';

const normalizeCalendarDate = (rawDate: string): string => {
  return rawDate ? rawDate.slice(0, 10) : '';
};

export class FinancialProductMapper {
  static toDomain(dto: FinancialProductDto): FinancialProduct {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      logo: dto.logo,
      releaseDate: normalizeCalendarDate(dto.date_release),
      revisionDate: normalizeCalendarDate(dto.date_revision),
    };
  }

  static toCreateDto(product: FinancialProduct): FinancialProductDto {
    return {
      id: product.id.trim(),
      name: product.name.trim(),
      description: product.description.trim(),
      logo: product.logo.trim(),
      date_release: normalizeCalendarDate(product.releaseDate),
      date_revision: normalizeCalendarDate(product.revisionDate),
    };
  }
  static toUpdateDto(product: UpdateFinancialProductPayload): UpdateFinancialProductDto {
    return {
      name: product.name.trim(),
      description: product.description.trim(),
      logo: product.logo.trim(),
      date_release: normalizeCalendarDate(product.releaseDate),
      date_revision: normalizeCalendarDate(product.revisionDate),
    };
  }
}
