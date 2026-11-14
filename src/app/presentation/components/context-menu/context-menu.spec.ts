import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContextMenu } from './context-menu';

describe('ContextMenu', () => {
  let component: ContextMenu;
  let fixture: ComponentFixture<ContextMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContextMenu],
    }).compileComponents();

    fixture = TestBed.createComponent(ContextMenu);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('productName', 'Tarjeta Oro');
    fixture.detectChanges();
  });

  it('should toggle dropdown and emit editClicked and deleteClicked', () => {
    const editSpy = jest.fn();
    const deleteSpy = jest.fn();
    component.editClicked.subscribe(editSpy);
    component.deleteClicked.subscribe(deleteSpy);

    const triggerButton = fixture.nativeElement.querySelector(
      '.context-menu__trigger',
    ) as HTMLButtonElement;
    triggerButton.click();
    fixture.detectChanges();

    const menuItems = fixture.nativeElement.querySelectorAll(
      '.context-menu__item',
    ) as NodeListOf<HTMLButtonElement>;
    expect(menuItems.length).toBe(2);

    menuItems[0].click();
    fixture.detectChanges();
    expect(editSpy).toHaveBeenCalledTimes(1);
    expect(component.isOpen()).toBe(false);

    triggerButton.click();
    fixture.detectChanges();
    const deleteButton = fixture.nativeElement.querySelectorAll(
      '.context-menu__item',
    )[1] as HTMLButtonElement;
    deleteButton.click();
    fixture.detectChanges();
    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(component.isOpen()).toBe(false);
  });

  it('should close menu on outside click and Escape key', () => {
    component.toggleMenu();
    expect(component.isOpen()).toBe(true);

    document.body.click();
    expect(component.isOpen()).toBe(false);

    component.toggleMenu();
    expect(component.isOpen()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.isOpen()).toBe(false);
  });
});
