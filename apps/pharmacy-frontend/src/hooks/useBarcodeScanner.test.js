import { describe, expect, it } from 'vitest';
import { isScannerBlockedByModal, resolveScanCode } from './useBarcodeScanner';

describe('useBarcodeScanner helpers', () => {
  it('resolveScanCode берёт весь код из поля, если буфер оборвался на хвосте', () => {
    expect(resolveScanCode('6789', '4607123456789')).toBe('4607123456789');
  });

  it('блокирует сканер, если фокус внутри модального диалога оплаты картой', () => {
    const searchInput = { id: 'search' };
    const cardModal = { contains: (el) => el !== searchInput };
    const rrnInput = {
      closest: (sel) => (sel.includes('[role="dialog"]') ? cardModal : null),
    };
    const fakeDoc = { querySelector: () => cardModal };

    expect(isScannerBlockedByModal(rrnInput, searchInput, fakeDoc)).toBe(true);
  });

  it('блокирует фоновый сканер при открытой aria-modal модалке, даже если фокус вне инпута', () => {
    const searchInput = { id: 'search' };
    const cardModal = { contains: () => false };
    const fakeDoc = { querySelector: () => cardModal };
    const bodyTarget = { closest: () => null };

    expect(isScannerBlockedByModal(bodyTarget, searchInput, fakeDoc)).toBe(true);
  });

  it('не блокирует сканер, когда модалок нет или dedicatedInput внутри самой модалки', () => {
    const modalInput = { id: 'modal-scan' };
    const modalWithScanner = { contains: (el) => el === modalInput };
    const fakeDocWithModal = { querySelector: () => modalWithScanner };
    const fakeDocClean = { querySelector: () => null };
    const mainTarget = { closest: () => null };

    expect(isScannerBlockedByModal(mainTarget, modalInput, fakeDocClean)).toBe(false);
    expect(isScannerBlockedByModal(modalInput, modalInput, fakeDocWithModal)).toBe(false);
  });
});
