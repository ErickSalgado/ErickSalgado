import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertBanner } from './alert-banner';

describe('AlertBanner', () => {
  let component: AlertBanner;
  let fixture: ComponentFixture<AlertBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertBanner],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertBanner);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('message', 'Error al cargar los productos');
    fixture.detectChanges();
  });

  it('should create and render the error message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(component).toBeTruthy();
    expect(compiled.textContent).toContain('Error al cargar los productos');
  });

  it('should emit dismissed when close button is clicked', () => {
    const dismissedSpy = jest.fn();
    component.dismissed.subscribe(dismissedSpy);

    const closeButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    closeButton.click();

    expect(dismissedSpy).toHaveBeenCalledTimes(1);
  });
});