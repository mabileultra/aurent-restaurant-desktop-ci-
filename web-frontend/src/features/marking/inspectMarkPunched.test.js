import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/pharmacyIntegration.api', () => ({
  pharmacyIntegrationApi: { verifyMarking: vi.fn() },
}));
vi.mock('../../api/pharmacySales.api', () => ({
  pharmacySalesApi: { checkMarkSold: vi.fn() },
}));
vi.mock('../../api/pharmacyStockMarks.api', () => ({
  pharmacyStockMarksApi: { check: vi.fn() },
}));

import { pharmacyIntegrationApi } from '../../api/pharmacyIntegration.api';
import { pharmacySalesApi } from '../../api/pharmacySales.api';
import { pharmacyStockMarksApi } from '../../api/pharmacyStockMarks.api';
import { assertCartMarksNotPunched, inspectMarkPunched } from './inspectMarkPunched';
import {
  clearSoldMarks,
  rememberSoldMarks,
} from './soldMarksStore';

const MARK = '010478001234567821PACK001\u001d91CRYPTAA';
const MARK_OTHER_TAIL = '010478001234567821PACK001\u001d91OTHERZZ';

describe('inspectMarkPunched — sold-gate до чека', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSoldMarks(7);
    pharmacyStockMarksApi.check.mockResolvedValue({ data: { found: true, alreadySold: false, status: 'IN_STOCK' } });
    pharmacySalesApi.checkMarkSold.mockResolvedValue({ data: { sold: false } });
  });

  it('локальный кэш — punched, без склада и ASL', async () => {
    rememberSoldMarks(7, [MARK]);
    const gate = await inspectMarkPunched({ storeId: 7, mark: MARK_OTHER_TAIL, aslEnabled: true });
    expect(gate.punched).toBe(true);
    expect(gate.aslResult.status).toBe('SOLD_LOCAL');
    expect(pharmacyStockMarksApi.check).not.toHaveBeenCalled();
    expect(pharmacyIntegrationApi.verifyMarking).not.toHaveBeenCalled();
  });

  it('IN_STOCK сам по себе не sold', async () => {
    const gate = await inspectMarkPunched({ storeId: 7, mark: MARK, aslEnabled: false });
    expect(gate.punched).toBe(false);
    expect(pharmacySalesApi.checkMarkSold).toHaveBeenCalled();
    expect(pharmacyIntegrationApi.verifyMarking).not.toHaveBeenCalled();
  });

  it('stock_marks alreadySold — punched, ASL не зовём', async () => {
    pharmacyStockMarksApi.check.mockResolvedValue({
      data: { found: false, alreadySold: true, status: 'PENDING_WITHDRAW' },
    });
    const gate = await inspectMarkPunched({ storeId: 7, mark: MARK, aslEnabled: true });
    expect(gate.punched).toBe(true);
    expect(pharmacySalesApi.checkMarkSold).not.toHaveBeenCalled();
    expect(pharmacyIntegrationApi.verifyMarking).not.toHaveBeenCalled();
  });

  it('журнал продаж sold — punched даже при IN_STOCK', async () => {
    pharmacySalesApi.checkMarkSold.mockResolvedValue({ data: { sold: true, status: 'SOLD' } });
    const gate = await inspectMarkPunched({ storeId: 7, mark: MARK, aslEnabled: true });
    expect(gate.punched).toBe(true);
    expect(pharmacyIntegrationApi.verifyMarking).not.toHaveBeenCalled();
  });

  it('ASL alreadySold только если ключ включён', async () => {
    pharmacyIntegrationApi.verifyMarking.mockResolvedValue({
      data: { found: true, alreadySold: true, status: 'WITHDRAWN' },
    });
    const off = await inspectMarkPunched({ storeId: 7, mark: MARK, aslEnabled: false });
    expect(off.punched).toBe(false);
    expect(pharmacyIntegrationApi.verifyMarking).not.toHaveBeenCalled();

    const on = await inspectMarkPunched({ storeId: 7, mark: MARK, aslEnabled: true });
    expect(on.punched).toBe(true);
    expect(pharmacyIntegrationApi.verifyMarking).toHaveBeenCalledTimes(1);
  });

  it('assertCartMarksNotPunched бросает MARK_ALREADY_SOLD', async () => {
    rememberSoldMarks(7, [MARK]);
    await expect(assertCartMarksNotPunched(7, [{ productMarks: [MARK_OTHER_TAIL] }]))
      .rejects.toMatchObject({ code: 'MARK_ALREADY_SOLD' });
  });
});
