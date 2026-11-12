import { describe, expect, it, vi } from 'vitest';
import { handleDrawerKeyDown } from './useDrawerFocusTrap';

describe('handleDrawerKeyDown', () => {
  it('calls onClose and prevents default when Escape is pressed', () => {
    const onClose = vi.fn();
    const event = {
      key: 'Escape',
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    handleDrawerKeyDown(event, { onClose });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('cycles focus from last element to first on forward Tab', () => {
    const firstEl = { focus: vi.fn() };
    const lastEl = { focus: vi.fn() };
    const container = {
      querySelectorAll: () => [firstEl, lastEl],
    };
    const event = {
      key: 'Tab',
      shiftKey: false,
      preventDefault: vi.fn(),
    };

    handleDrawerKeyDown(event, {
      container,
      activeElement: lastEl,
      onClose: vi.fn(),
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(firstEl.focus).toHaveBeenCalled();
  });

  it('cycles focus from first element to last on backward Tab (Shift+Tab)', () => {
    const firstEl = { focus: vi.fn() };
    const lastEl = { focus: vi.fn() };
    const container = {
      querySelectorAll: () => [firstEl, lastEl],
    };
    const event = {
      key: 'Tab',
      shiftKey: true,
      preventDefault: vi.fn(),
    };

    handleDrawerKeyDown(event, {
      container,
      activeElement: firstEl,
      onClose: vi.fn(),
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(lastEl.focus).toHaveBeenCalled();
  });

  it('does nothing on other keys', () => {
    const onClose = vi.fn();
    const event = {
      key: 'Enter',
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    handleDrawerKeyDown(event, { onClose });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
