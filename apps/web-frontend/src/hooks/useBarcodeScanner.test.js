import { describe, expect, it } from 'vitest';
import { resolveScanCode } from './useBarcodeScanner';
import { isScannerBlockedByModal } from './barcodeScannerUtils';

describe('resolveScanCode', () => {
  it('берёт весь код из поля, если буфер оборвался на хвосте', () => {
    expect(resolveScanCode('6789', '4607123456789')).toBe('4607123456789');
  });

  it('берёт буфер, когда поле пустое (фокус не в поиске)', () => {
    expect(resolveScanCode('4607123456789', '')).toBe('4607123456789');
  });

  it('короткий хвост без поля не считается кодом', () => {
    expect(resolveScanCode('12', '')).toBe('12');
  });

  it('имя в поиске не превращает в штрихкод', () => {
    expect(resolveScanCode('ко', 'молоко')).toBe('ко');
  });
});

describe('isScannerBlockedByModal', () => {
  it('блокирует перехват ввода в модалках оплаты (RRN / номер карты)', () => {
    const searchInput = { id: 'search' };
    const dialog = { contains: (el) => el !== searchInput };
    const rrnInput = { closest: () => dialog };
    expect(isScannerBlockedByModal(rrnInput, searchInput, { querySelector: () => dialog })).toBe(true);
  });

  it('разрешает сканирование на основном экране без открытых модалок', () => {
    const searchInput = { id: 'search' };
    const target = { closest: () => null };
    expect(isScannerBlockedByModal(target, searchInput, { querySelector: () => null })).toBe(false);
  });
});
