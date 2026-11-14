import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { FinancialProductRepository } from '../../domain/repositories/financial-product.repository';
import { catchError, map, Observable, of, switchMap, timer } from 'rxjs';

export const PRODUCT_VALIDATION_RULES = {
  idMinLength: 3,
  idMaxLength: 10,
  nameMinLength: 5,
  nameMaxLength: 100,
  descriptionMinLength: 10,
  descriptionMaxLength: 200,
} as const;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const padTwoDigits = (numberValue: number): string => {
  return String(numberValue).padStart(2, '0');
};

const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

export const getTodayIsoDate = (referenceDate: Date = new Date()): string => {
  const year = referenceDate.getFullYear();
  const month = padTwoDigits(referenceDate.getMonth() + 1);
  const day = padTwoDigits(referenceDate.getDate());
  return `${year}-${month}-${day}`;
};

export const addOneYearToIsoDate = (isoDate: string): string => {
  if (!ISO_DATE_PATTERN.test(isoDate)) {
    return '';
  }
  const [yearPart, monthPart, dayPart] = isoDate.split('-').map(Number);
  const nextYear = yearPart + 1;
  const adjustedDay = monthPart === 2 && dayPart === 29 && !isLeapYear(nextYear) ? 28 : dayPart;
  return `${nextYear}-${padTwoDigits(monthPart)}-${padTwoDigits(adjustedDay)}`;
};

export const minTodayDateValidator = (referenceDateProvider: () => Date = () => new Date()): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = typeof control.value === 'string' ? control.value.trim() : '';
    if (!rawValue) {
      return null;
    }

    if (!ISO_DATE_PATTERN.test(rawValue)) {
      return { invalidDateFormat: true };
    }

    const todayIsoDate = getTodayIsoDate(referenceDateProvider());
    return rawValue < todayIsoDate ? { minTodayDate: { minDate: todayIsoDate } } : null;
  };
};

export const revisionDateMatchesReleaseValidator = (
  releaseDateControlName = 'releaseDate',
  revisionDateControlName = 'revisionDate',
): ValidatorFn => {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const releaseControl = formGroup.get(releaseDateControlName);
    const revisionControl = formGroup.get(revisionDateControlName);
    if (!releaseControl || !revisionControl) {
      return null;
    }
    const releaseValue =
      typeof releaseControl.value === 'string' ? releaseControl.value.trim() : '';
    const revisionValue =
      typeof revisionControl.value === 'string' ? revisionControl.value.trim() : '';
    if (!releaseValue || !revisionValue) {
      return null;
    }
    const expectedRevisionDate = addOneYearToIsoDate(releaseValue);
    return revisionValue === expectedRevisionDate
      ? null
      : { revisionDateMismatch: { expectedDate: expectedRevisionDate } };
  };
};

export const createUniqueProductIdValidator = (
  repository: FinancialProductRepository,
  debounceMs = 300,
): AsyncValidatorFn => {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const rawId = typeof control.value === 'string' ? control.value.trim() : '';
    if (
      !rawId ||
      rawId.length < PRODUCT_VALIDATION_RULES.idMinLength ||
      rawId.length > PRODUCT_VALIDATION_RULES.idMaxLength
    ) {
      return of(null);
    }
    return timer(debounceMs).pipe(
      switchMap(() => repository.verifyIdExists(rawId)),
      map((alreadyExists) => (alreadyExists ? { idAlreadyExists: true } : null)),
      catchError(() => of({ idVerificationFailed: true })),
    );
  };
};
