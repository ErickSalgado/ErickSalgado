import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableSkeleton } from './table-skeleton';

describe('TableSkeleton', () => {
  let fixture: ComponentFixture<TableSkeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableSkeleton],
    }).compileComponents();

    fixture = TestBed.createComponent(TableSkeleton);
    fixture.detectChanges();
  });

  it('should render 5 skeleton rows by default', () => {
    const rows = fixture.nativeElement.querySelectorAll('.skeleton-table__row');
    expect(rows.length).toBe(5);
  });

  it('should render the requested number of skeleton rows', () => {
    fixture.componentRef.setInput('rowCount', 10);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.skeleton-table__row');
    expect(rows.length).toBe(10);
  });
});
