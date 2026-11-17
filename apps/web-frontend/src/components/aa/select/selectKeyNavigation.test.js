import { describe, expect, it, vi } from 'vitest';
import { onTriggerKeyDown, onListKeyDown } from './selectKeyNavigation';

describe('selectKeyNavigation', () => {
  it('does nothing when disabled', () => {
    const setIsOpen = vi.fn();
    const e = { key: 'ArrowDown', preventDefault: vi.fn() };
    onTriggerKeyDown({ e, disabled: true, setIsOpen });
    expect(setIsOpen).not.toHaveBeenCalled();
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('opens dropdown on ArrowDown when closed', () => {
    const setIsOpen = vi.fn();
    const e = { key: 'ArrowDown', preventDefault: vi.fn() };
    onTriggerKeyDown({
      e,
      disabled: false,
      isOpen: false,
      setIsOpen,
      filteredOptions: [],
    });
    expect(e.preventDefault).toHaveBeenCalled();
    expect(setIsOpen).toHaveBeenCalledWith(true);
  });

  it('navigates on list ArrowDown and ArrowUp', () => {
    const setActiveIndex = vi.fn();
    const e = { key: 'ArrowDown', preventDefault: vi.fn(), stopPropagation: vi.fn() };
    const filteredOptions = [{ value: 'a' }, { value: 'b' }];
    onListKeyDown({
      e,
      filteredOptions,
      activeIndex: 0,
      setActiveIndex,
    });
    expect(e.preventDefault).toHaveBeenCalled();
    expect(setActiveIndex).toHaveBeenCalled();
  });
});
