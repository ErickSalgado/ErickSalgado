import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'calendarDate',
})
export class CalendarDatePipe implements PipeTransform {
  transform(isoDate: string | null | undefined): string {
    if (!isoDate) {
      return '';
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
    if (!match) {
      return isoDate;
    }

    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
}
