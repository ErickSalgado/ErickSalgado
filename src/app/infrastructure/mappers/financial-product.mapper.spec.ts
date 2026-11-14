import { FinancialProduct, UpdateFinancialProductPayload } from '../../domain/models/financial-product.model';
import { FinancialProductDto } from '../dtos/financial-product.dto';
import { FinancialProductMapper } from './financial-product.mapper';

describe('FinancialProductMapper', () => {
  it('should map a DTO to a FinancialProduct domain model and normalize dates', () => {
    const productDto: FinancialProductDto = {
      id: 'trj-crd',
      name: 'Tarjetas de Crédito',
      description: 'Tarjeta de consumo bajo la modalidad de crédito',
      logo: 'https://example.com/visa.png',
      date_release: '2026-12-01T00:00:00.000Z',
      date_revision: '2027-12-01T00:00:00.000Z',
    };

    const mappedProduct = FinancialProductMapper.toDomain(productDto);

    expect(mappedProduct).toEqual({
      id: 'trj-crd',
      name: 'Tarjetas de Crédito',
      description: 'Tarjeta de consumo bajo la modalidad de crédito',
      logo: 'https://example.com/visa.png',
      releaseDate: '2026-12-01',
      revisionDate: '2027-12-01',
    });
  });

  it('should handle empty date strings when mapping from DTO', () => {
    const productDto: FinancialProductDto = {
      id: 'trj-deb',
      name: 'Tarjeta Débito',
      description: 'Tarjeta de débito cuenta de ahorros',
      logo: 'logo.png',
      date_release: '',
      date_revision: '',
    };

    const mappedProduct = FinancialProductMapper.toDomain(productDto);

    expect(mappedProduct.releaseDate).toBe('');
    expect(mappedProduct.revisionDate).toBe('');
  });

  it('should map a domain model to a create DTO trimming whitespace', () => {
    const domainProduct: FinancialProduct = {
      id: '  trj-crd  ',
      name: '  Tarjeta Oro  ',
      description: '  Tarjeta con beneficios exclusivos  ',
      logo: '  https://example.com/logo.png  ',
      releaseDate: '2026-12-01',
      revisionDate: '2027-12-01',
    };

    const createDto = FinancialProductMapper.toCreateDto(domainProduct);

    expect(createDto).toEqual({
      id: 'trj-crd',
      name: 'Tarjeta Oro',
      description: 'Tarjeta con beneficios exclusivos',
      logo: 'https://example.com/logo.png',
      date_release: '2026-12-01',
      date_revision: '2027-12-01',
    });
  });

  it('should map an update payload to an update DTO without id', () => {
    const updatePayload: UpdateFinancialProductPayload = {
      name: '  Cuenta Ahorros  ',
      description: '  Cuenta de ahorros sin costo mensual  ',
      logo: '  https://example.com/ahorros.png  ',
      releaseDate: '2026-12-15',
      revisionDate: '2027-12-15',
    };

    const updateDto = FinancialProductMapper.toUpdateDto(updatePayload);

    expect(updateDto).toEqual({
      name: 'Cuenta Ahorros',
      description: 'Cuenta de ahorros sin costo mensual',
      logo: 'https://example.com/ahorros.png',
      date_release: '2026-12-15',
      date_revision: '2027-12-15',
    });
  });
});
