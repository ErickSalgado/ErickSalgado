import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  FinancialProduct,
  UpdateFinancialProductPayload,
} from '../../domain/models/financial-product.model';
import { FinancialProductDto } from '../dtos/financial-product.dto';
import { FinancialProductHttpRepository } from './financial-product-http.repository';

describe('FinancialProductHttpRepository', () => {
  let repository: FinancialProductHttpRepository;
  let httpTestingController: HttpTestingController;

  const sampleProductDto: FinancialProductDto = {
    id: 'trj-crd',
    name: 'Tarjetas de Crédito',
    description: 'Tarjeta de consumo bajo la modalidad de crédito',
    logo: 'https://example.com/visa.png',
    date_release: '2026-12-01',
    date_revision: '2027-12-01',
  };

  const sampleDomainProduct: FinancialProduct = {
    id: 'trj-crd',
    name: 'Tarjetas de Crédito',
    description: 'Tarjeta de consumo bajo la modalidad de crédito',
    logo: 'https://example.com/visa.png',
    releaseDate: '2026-12-01',
    revisionDate: '2027-12-01',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FinancialProductHttpRepository,
      ],
    });

    repository = TestBed.inject(FinancialProductHttpRepository);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch and map all financial products', () => {
    let productsResponse: FinancialProduct[] | undefined;

    repository.getAll().subscribe((products) => {
      productsResponse = products;
    });

    const pendingRequest = httpTestingController.expectOne('/bp/products');
    expect(pendingRequest.request.method).toBe('GET');
    pendingRequest.flush({ data: [sampleProductDto] });

    expect(productsResponse).toEqual([sampleDomainProduct]);
  });

  it('should fetch a single financial product by id', () => {
    let productResponse: FinancialProduct | undefined;

    repository.getById('trj/1').subscribe((product) => {
      productResponse = product;
    });

    const pendingRequest = httpTestingController.expectOne('/bp/products/trj%2F1');
    expect(pendingRequest.request.method).toBe('GET');
    pendingRequest.flush(sampleProductDto);

    expect(productResponse).toEqual(sampleDomainProduct);
  });

  it('should verify if a product id exists', () => {
    let idExists: boolean | undefined;

    repository.verifyIdExists('  trj-crd  ').subscribe((exists) => {
      idExists = exists;
    });

    const pendingRequest = httpTestingController.expectOne('/bp/products/verification/trj-crd');
    expect(pendingRequest.request.method).toBe('GET');
    pendingRequest.flush(true);

    expect(idExists).toBe(true);
  });

  it('should create a financial product and return mapped domain model', () => {
    let createdProduct: FinancialProduct | undefined;

    repository.create(sampleDomainProduct).subscribe((product) => {
      createdProduct = product;
    });

    const pendingRequest = httpTestingController.expectOne('/bp/products');
    expect(pendingRequest.request.method).toBe('POST');
    expect(pendingRequest.request.body).toEqual(sampleProductDto);
    pendingRequest.flush({
      message: 'Product added successfully',
      data: sampleProductDto,
    });

    expect(createdProduct).toEqual(sampleDomainProduct);
  });

  it('should update a financial product preserving its id', () => {
    let updatedProduct: FinancialProduct | undefined;
    const updatePayload: UpdateFinancialProductPayload = {
      name: 'Tarjeta Platino',
      description: 'Descripción actualizada del producto',
      logo: 'https://example.com/platino.png',
      releaseDate: '2026-12-10',
      revisionDate: '2027-12-10',
    };

    repository.update('trj-crd', updatePayload).subscribe((product) => {
      updatedProduct = product;
    });

    const pendingRequest = httpTestingController.expectOne('/bp/products/trj-crd');
    expect(pendingRequest.request.method).toBe('PUT');
    expect(pendingRequest.request.body).toEqual({
      name: 'Tarjeta Platino',
      description: 'Descripción actualizada del producto',
      logo: 'https://example.com/platino.png',
      date_release: '2026-12-10',
      date_revision: '2027-12-10',
    });
    pendingRequest.flush({
      message: 'Product updated successfully',
      data: pendingRequest.request.body,
    });

    expect(updatedProduct).toEqual({
      id: 'trj-crd',
      ...updatePayload,
    });
  });

  it('should delete a financial product by id', () => {
    let deleteCompleted = false;

    repository.delete('trj-crd').subscribe(() => {
      deleteCompleted = true;
    });

    const pendingRequest = httpTestingController.expectOne('/bp/products/trj-crd');
    expect(pendingRequest.request.method).toBe('DELETE');
    pendingRequest.flush({ message: 'Product removed successfully' });

    expect(deleteCompleted).toBe(true);
  });
});
