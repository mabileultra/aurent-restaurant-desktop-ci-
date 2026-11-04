import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ShiftCashMovementModal from './ShiftCashMovementModal';
import { cashierShiftApi } from '../../../api/cashierShift.api';

globalThis.React = React;

vi.mock('../../../api/cashierShift.api', () => ({
  cashierShiftApi: {
    cashIn: vi.fn(),
    cashOut: vi.fn(),
  },
}));

vi.mock('../../../components/shared/PosModalPortal', () => ({
  default: ({ open, children }) => (open ? React.createElement('div', { 'data-testid': 'portal' }, children) : null),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ShiftCashMovementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(ShiftCashMovementModal, {
        open: false,
        direction: 'IN',
        shiftId: 'shift-123',
        onClose: vi.fn(),
      })
    );
    expect(html).toBe('');
  });

  it('renders Cash In modal with title and quick presets', () => {
    const html = renderToStaticMarkup(
      React.createElement(ShiftCashMovementModal, {
        open: true,
        direction: 'IN',
        shiftId: 'shift-123',
        onClose: vi.fn(),
      })
    );
    expect(html).toContain('Kassaga pul kiritish');
    expect(html).toContain('+10');
    expect(html).toContain('+50');
    expect(html).toContain('+100');
    expect(html).toContain('+500');
    expect(html).toContain('Kiritish');
  });

  it('renders Cash Out modal with inkassatsiya title and action button', () => {
    const html = renderToStaticMarkup(
      React.createElement(ShiftCashMovementModal, {
        open: true,
        direction: 'OUT',
        shiftId: 'shift-123',
        onClose: vi.fn(),
      })
    );
    expect(html).toContain('Kassadan pul yechish');
    expect(html).toContain('Yechish');
  });
});
