import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmModal } from './confirm-modal';

describe('ConfirmModal', () => {
  let component: ConfirmModal;
  let fixture: ComponentFixture<ConfirmModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('message', '¿Estas seguro de eliminar el producto Tarjeta?');
    fixture.detectChanges();
  });

  it('should not render dialog when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
  });

  it('should emit cancelled and confirmed when action buttons are clicked', () => {
    const cancelledSpy = jest.fn();
    const confirmedSpy = jest.fn();
    component.cancelled.subscribe(cancelledSpy);
    component.confirmed.subscribe(confirmedSpy);

    const buttons = fixture.nativeElement.querySelectorAll(
      '.modal-card__button',
    ) as NodeListOf<HTMLButtonElement>;

    buttons[0].click();
    buttons[1].click();

    expect(cancelledSpy).toHaveBeenCalledTimes(1);
    expect(confirmedSpy).toHaveBeenCalledTimes(1);
  });

  it('should close on backdrop click or Escape and block actions while processing', () => {
    const cancelledSpy = jest.fn();
    component.cancelled.subscribe(cancelledSpy);

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement;
    backdrop.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(cancelledSpy).toHaveBeenCalledTimes(2);

    fixture.componentRef.setInput('isProcessing', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Eliminando...');

    backdrop.click();
    component.onConfirm();
    expect(cancelledSpy).toHaveBeenCalledTimes(2);
  });
});
