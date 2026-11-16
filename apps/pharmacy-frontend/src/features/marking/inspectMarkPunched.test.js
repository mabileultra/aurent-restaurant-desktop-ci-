import { beforeEach, describe, expect, it, vi } from 'vitest';

const checkPharmacySaleMark = vi.fn();
const checkStockMark = vi.fn();
const isMarkSoldLocally = vi.fn();
const rememberSoldMarks = vi.fn();
const forgetSoldMarks = vi.fn();
const collectMarksFromCartItems = vi.fn();

vi.mock('../../api/pharmacySales.api', () => ({
  pharmacySalesApi: {
    checkMarkSold: (...args) => checkPharmacySaleMark(...args),
  },
}));

vi.mock('../../api/pharmacyStockMarks.api', () => ({
  pharmacyStockMarksApi: {
    check: (...args) => checkStockMark(...args),
  },
}));

vi.mock('./soldMarksStore', () => ({
  isMarkSoldLocally: (...args) => isMarkSoldLocally(...args),
  rememberSoldMarks: (...args) => rememberSoldMarks(...args),
  forgetSoldMarks: (...args) => forgetSoldMarks(...args),
  collectMarksFromCartItems: (...args) => collectMarksFromCartItems(...args),
}));

import { assertCartMarksNotPunched, inspectMarkPunched } from './inspectMarkPunched';

const STORE_ID = 10;
const MARK = '010478001234567821SERIAL';

beforeEach(() => {
  checkPharmacySaleMark.mockReset();
  checkStockMark.mockReset();
  isMarkSoldLocally.mockReset();
  rememberSoldMarks.mockReset();
  forgetSoldMarks.mockReset();
  collectMarksFromCartItems.mockReset();
});

describe('inspectMarkPunched', () => {
  it('сохраняет локальную блокировку марки, если pharmacySalesApi подтверждает продажу', async () => {
    isMarkSoldLocally.mockReturnValue(true);
    checkPharmacySaleMark.mockResolvedValue({ data: { sold: true, status: 'SOLD' } });

    const res = await inspectMarkPunched({ storeId: STORE_ID, mark: MARK });

    expect(res.punched).toBe(true);
    expect(checkPharmacySaleMark).toHaveBeenCalledWith({ storeId: STORE_ID, code: MARK });
    expect(forgetSoldMarks).not.toHaveBeenCalled();
  });

  it('очищает локальный кэш и проверяет склад/продажи, если в pharmacySalesApi продажа отменена', async () => {
    isMarkSoldLocally.mockReturnValue(true);
    checkPharmacySaleMark.mockResolvedValue({ data: { sold: false } });
    checkStockMark.mockResolvedValue({ data: { alreadySold: false } });

    const res = await inspectMarkPunched({ storeId: STORE_ID, mark: MARK });

    expect(forgetSoldMarks).toHaveBeenCalledWith(STORE_ID, [MARK]);
    expect(res.punched).toBe(false);
  });

  it('запоминает марку в локальном кэше при обнаружении продажи в pharmacySalesApi', async () => {
    isMarkSoldLocally.mockReturnValue(false);
    checkStockMark.mockResolvedValue({ data: { alreadySold: false } });
    checkPharmacySaleMark.mockResolvedValue({ data: { sold: true, status: 'SOLD' } });

    const res = await inspectMarkPunched({ storeId: STORE_ID, mark: MARK });

    expect(res.punched).toBe(true);
    expect(rememberSoldMarks).toHaveBeenCalledWith(STORE_ID, [MARK]);
  });

  it('assertCartMarksNotPunched выбрасывает MARK_ALREADY_SOLD для пробитой марки', async () => {
    collectMarksFromCartItems.mockReturnValue([MARK]);
    isMarkSoldLocally.mockReturnValue(false);
    checkStockMark.mockResolvedValue({ data: { alreadySold: true, status: 'SOLD' } });
    checkPharmacySaleMark.mockResolvedValue({ data: { sold: false } });

    await expect(assertCartMarksNotPunched(STORE_ID, [])).rejects.toMatchObject({
      code: 'MARK_ALREADY_SOLD',
    });
  });
});

