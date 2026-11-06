import { describe, it, expect, vi } from 'vitest';
import { trapFocus } from './focusTrapUtils';

describe('trapFocus', () => {
  function createMockContainer(elements) {
    return {
      querySelectorAll: vi.fn(() => elements),
      contains: vi.fn((el) => elements.includes(el)),
    };
  }

  it('does nothing if event or container is null', () => {
    expect(trapFocus(null, null)).toBe(false);
  });

  it('does nothing if key is not Tab', () => {
    const event = { key: 'Escape', preventDefault: vi.fn() };
    const container = createMockContainer([]);
    expect(trapFocus(event, container)).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('prevents default if no focusable elements inside container', () => {
    const event = { key: 'Tab', preventDefault: vi.fn() };
    const container = createMockContainer([]);
    expect(trapFocus(event, container)).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('cycles from last element to first element on Tab', () => {
    const btnFirst = { focus: vi.fn() };
    const btnLast = { focus: vi.fn() };
    const container = createMockContainer([btnFirst, btnLast]);
    const event = { key: 'Tab', shiftKey: false, target: btnLast, preventDefault: vi.fn() };

    expect(trapFocus(event, container)).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(btnFirst.focus).toHaveBeenCalled();
  });

  it('cycles from first element to last element on Shift+Tab', () => {
    const btnFirst = { focus: vi.fn() };
    const btnLast = { focus: vi.fn() };
    const container = createMockContainer([btnFirst, btnLast]);
    const event = { key: 'Tab', shiftKey: true, target: btnFirst, preventDefault: vi.fn() };

    expect(trapFocus(event, container)).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(btnLast.focus).toHaveBeenCalled();
  });
});
