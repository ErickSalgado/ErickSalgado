import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppError } from '../models/app-error.model';
import { httpErrorInterceptor } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should map network failure (status 0) into an AppError', () => {
    let capturedError: AppError | undefined;

    httpClient.get('/bp/products').subscribe({
      error: (error: AppError) => {
        capturedError = error;
      },
    });

    const pendingRequest = httpTestingController.expectOne('/bp/products');
    pendingRequest.error(new ProgressEvent('error'));

    expect(capturedError).toBeInstanceOf(AppError);
    expect(capturedError?.statusCode).toBe(0);
    expect(capturedError?.userMessage).toContain('No se pudo conectar con el servidor');
  });

  it('should extract class-validator constraints on HTTP 400', () => {
    let capturedError: AppError | undefined;

    httpClient.post('/bp/products', {}).subscribe({
      error: (error: AppError) => {
        capturedError = error;
      },
    });

    const pendingRequest = httpTestingController.expectOne('/bp/products');
    pendingRequest.flush(
      {
        name: 'BadRequestError',
        message: "Invalid body, check 'errors' property for more info.",
        errors: [
          {
            property: 'name',
            constraints: {
              minLength: 'name must be longer than or equal to 6 characters',
            },
          },
        ],
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(capturedError?.statusCode).toBe(400);
    expect(capturedError?.details).toEqual([
      'name must be longer than or equal to 6 characters',
    ]);
    expect(capturedError?.userMessage).toContain(
      'name must be longer than or equal to 6 characters',
    );
  });

  it('should use fallback message on HTTP 400 when body has no message or details', () => {
    let capturedError: AppError | undefined;

    httpClient.post('/bp/products', {}).subscribe({
      error: (error: AppError) => {
        capturedError = error;
      },
    });

    const pendingRequest = httpTestingController.expectOne('/bp/products');
    pendingRequest.flush(null, { status: 400, statusText: 'Bad Request' });

    expect(capturedError?.statusCode).toBe(400);
    expect(capturedError?.userMessage).toBe(
      'Los datos enviados no cumplen con las validaciones requeridas.',
    );
  });

  it('should map HTTP 404 with server message or default fallback', () => {
    let capturedError: AppError | undefined;

    httpClient.get('/bp/products/unknown').subscribe({
      error: (error: AppError) => {
        capturedError = error;
      },
    });

    const pendingRequest = httpTestingController.expectOne('/bp/products/unknown');
    pendingRequest.flush(
      { message: 'Not product found with that identifier' },
      { status: 404, statusText: 'Not Found' },
    );

    expect(capturedError?.statusCode).toBe(404);
    expect(capturedError?.userMessage).toBe('Not product found with that identifier');
  });

  it('should map HTTP 500+ to a friendly server error message', () => {
    let capturedError: AppError | undefined;

    httpClient.get('/bp/products').subscribe({
      error: (error: AppError) => {
        capturedError = error;
      },
    });

    const pendingRequest = httpTestingController.expectOne('/bp/products');
    pendingRequest.flush(
      { message: 'Internal failure' },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(capturedError?.statusCode).toBe(500);
    expect(capturedError?.userMessage).toBe(
      'Ocurrió un error interno en el servidor. Intenta nuevamente más tarde.',
    );
  });

  it('should map other HTTP status codes using server message or fallback', () => {
    let capturedError: AppError | undefined;

    httpClient.get('/bp/products').subscribe({
      error: (error: AppError) => {
        capturedError = error;
      },
    });

    const pendingRequest = httpTestingController.expectOne('/bp/products');
    pendingRequest.flush({}, { status: 403, statusText: 'Forbidden' });

    expect(capturedError?.statusCode).toBe(403);
    expect(capturedError?.userMessage).toBe(
      'Ocurrió un error inesperado al procesar la solicitud.',
    );
  });
});
