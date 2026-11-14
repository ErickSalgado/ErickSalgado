import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { AppError } from '../models/app-error.model';
import { catchError, throwError } from 'rxjs';

const extractValidationDetails = (errorBody: unknown): string[] => {
  if (!errorBody || typeof errorBody !== 'object') {
    return [];
  }

  const recordBody = errorBody as Record<string, unknown>;
  const rawErrors = recordBody['errors'];
  if (!Array.isArray(rawErrors)) {
    return [];
  }

  const extractedMessages: string[] = [];
  for (const validationItem of rawErrors) {
    if (!validationItem || typeof validationItem !== 'object') {
      continue;
    }
    const constraints = (validationItem as Record<string, unknown>)['constraints'];
    if (constraints && typeof constraints === 'object') {
      const constraintsValues = Object.values(constraints as Record<string, unknown>).filter(
        (value): value is string => typeof value === 'string',
      );
      extractedMessages.push(...constraintsValues);
    }
  }
  return extractedMessages;
};

const mapHttpErrorToAppError = (httpError: HttpErrorResponse): AppError => {
  if (httpError.status === 0) {
    return new AppError(
      0,
      'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet o intenta más tarde.',
    );
  }

  const serverMessage =
    httpError.error &&
    typeof httpError.error === 'object' &&
    typeof (httpError.error as Record<string, unknown>)['message'] === 'string'
      ? ((httpError.error as Record<string, unknown>)['message'] as string)
      : '';

  const validationDetails = extractValidationDetails(httpError.error);

  if (httpError.status === 400) {
    return new AppError(
      400,
      validationDetails.length > 0
        ? `Datos inválidos: ${validationDetails.join(', ')}`
        : serverMessage || 'Los datos enviados no cumplen con las validaciones requeridas.',
      validationDetails,
    );
  }

  if (httpError.status === 404) {
    return new AppError(404, serverMessage || 'No se encontró el producto financiero solicitado.');
  }

  if (httpError.status >= 500) {
    return new AppError(
      httpError.status,
      'Ocurrió un error interno en el servidor. Intenta nuevamente más tarde.',
    );
  }

  return new AppError(
    httpError.status,
    serverMessage || 'Ocurrió un error inesperado al procesar la solicitud.',
  );
};

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        return throwError(() => mapHttpErrorToAppError(error));
      }
      return throwError(() => new AppError(500, 'Ocurrió un error inesperado'));
    }),
  );
};
