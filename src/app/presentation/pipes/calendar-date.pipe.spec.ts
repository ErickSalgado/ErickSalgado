import { CalendarDatePipe } from './calendar-date.pipe';

describe('CalendarDatePipe', () => {
  const pipe = new CalendarDatePipe();

  it('should format YYYY-MM-DD as DD/MM/YYYY without timezone shift', () => {
    expect(pipe.transform('2025-01-01')).toBe('01/01/2025');
    expect(pipe.transform('2026-11-14T00:00:00.000Z')).toBe('14/11/2026');
  });

  it('should return empty string for null/undefined and preserve non-ISO values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('01/01/2025')).toBe('01/01/2025');
  });
});
