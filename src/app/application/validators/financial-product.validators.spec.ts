import { FormControl, FormGroup } from '@angular/forms';
import { from, of, throwError } from 'rxjs';
import { FinancialProductRepository } from '../../domain/repositories/financial-product.repository';
import {
  addOneYearToIsoDate,
  createUniqueProductIdValidator,
  getTodayIsoDate,
  minTodayDateValidator,
  revisionDateMatchesReleaseValidator,
} from './financial-product.validators';

describe('financial-product.validators', () => {
  describe('getTodayIsoDate', () => {
    it('should format a local Date as YYYY-MM-DD', () => {
      const referenceDate = new Date(2026, 10, 5);
      expect(getTodayIsoDate(referenceDate)).toBe('2026-11-05');
    });
  });

  describe('addOneYearToIsoDate', () => {
    it('should add exactly one year to a valid ISO date', () => {
      expect(addOneYearToIsoDate('2026-11-14')).toBe('2027-11-14');
    });

    it('should adjust Feb 29 on leap year to Feb 28 on non-leap year', () => {
      expect(addOneYearToIsoDate('2024-02-29')).toBe('2025-02-28');
    });

    it('should return empty string for invalid date formats', () => {
      expect(addOneYearToIsoDate('14/11/2026')).toBe('');
    });
  });

  describe('minTodayDateValidator', () => {
    const fixedTodayProvider = () => new Date(2026, 10, 14);
    const validator = minTodayDateValidator(fixedTodayProvider);

    it('should return null when value is empty', () => {
      expect(validator(new FormControl(''))).toBeNull();
    });

    it('should return invalidDateFormat for malformed dates', () => {
      expect(validator(new FormControl('2026/11/14'))).toEqual({
        invalidDateFormat: true,
      });
    });

    it('should return minTodayDate error when date is before today', () => {
      expect(validator(new FormControl('2026-11-13'))).toEqual({
        minTodayDate: { minDate: '2026-11-14' },
      });
    });

    it('should return null when date equals today or is in the future', () => {
      expect(validator(new FormControl('2026-11-14'))).toBeNull();
      expect(validator(new FormControl('2026-12-01'))).toBeNull();
    });
  });

  describe('revisionDateMatchesReleaseValidator', () => {
    const groupValidator = revisionDateMatchesReleaseValidator();

    it('should return null when controls are missing or empty', () => {
      const emptyGroup = new FormGroup({});
      expect(groupValidator(emptyGroup)).toBeNull();

      const partialGroup = new FormGroup({
        releaseDate: new FormControl('2026-11-14'),
        revisionDate: new FormControl(''),
      });
      expect(groupValidator(partialGroup)).toBeNull();
    });

    it('should return null when revisionDate is exactly one year after releaseDate', () => {
      const validGroup = new FormGroup({
        releaseDate: new FormControl('2026-11-14'),
        revisionDate: new FormControl('2027-11-14'),
      });
      expect(groupValidator(validGroup)).toBeNull();
    });

    it('should return revisionDateMismatch when revisionDate is not one year after releaseDate', () => {
      const invalidGroup = new FormGroup({
        releaseDate: new FormControl('2026-11-14'),
        revisionDate: new FormControl('2027-11-15'),
      });
      expect(groupValidator(invalidGroup)).toEqual({
        revisionDateMismatch: { expectedDate: '2027-11-14' },
      });
    });
  });

  describe('createUniqueProductIdValidator', () => {
    let repositoryMock: Pick<FinancialProductRepository, 'verifyIdExists'>;

    beforeEach(() => {
      jest.useFakeTimers();
      repositoryMock = {
        verifyIdExists: jest.fn(),
      };
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should not call repository when id length is outside allowed range', () => {
      const asyncValidator = createUniqueProductIdValidator(
        repositoryMock as FinancialProductRepository,
      );

      let validationResult: unknown;
      from(asyncValidator(new FormControl('ab'))).subscribe((result) => {
        validationResult = result;
      });

      expect(validationResult).toBeNull();
      expect(repositoryMock.verifyIdExists).not.toHaveBeenCalled();
    });

    it('should return idAlreadyExists when repository returns true', () => {
      (repositoryMock.verifyIdExists as jest.Mock).mockReturnValue(of(true));
      const asyncValidator = createUniqueProductIdValidator(
        repositoryMock as FinancialProductRepository,
        300,
      );

      let validationResult: unknown;
      from(asyncValidator(new FormControl('trj-crd'))).subscribe((result) => {
        validationResult = result;
      });

      jest.advanceTimersByTime(300);

      expect(repositoryMock.verifyIdExists).toHaveBeenCalledWith('trj-crd');
      expect(validationResult).toEqual({ idAlreadyExists: true });
    });

    it('should return null when repository returns false', () => {
      (repositoryMock.verifyIdExists as jest.Mock).mockReturnValue(of(false));
      const asyncValidator = createUniqueProductIdValidator(
        repositoryMock as FinancialProductRepository,
        300,
      );

      let validationResult: unknown = 'pending';
      from(asyncValidator(new FormControl('nuevo-id'))).subscribe((result) => {
        validationResult = result;
      });

      jest.advanceTimersByTime(300);

      expect(validationResult).toBeNull();
    });

    it('should return idVerificationFailed when repository throws an error', () => {
      (repositoryMock.verifyIdExists as jest.Mock).mockReturnValue(
        throwError(() => new Error('Network down')),
      );
      const asyncValidator = createUniqueProductIdValidator(
        repositoryMock as FinancialProductRepository,
        300,
      );

      let validationResult: unknown;
      from(asyncValidator(new FormControl('trj-crd'))).subscribe((result) => {
        validationResult = result;
      });

      jest.advanceTimersByTime(300);

      expect(validationResult).toEqual({ idVerificationFailed: true });
    });
  });
});