import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  localFirst: true,
  printers: [],
  sends: [],
}));

vi.mock('../../../../src/services/offline/restaurantOfflineBridge', () => ({
  isRestaurantLocalFirstOn: () => h.localFirst,
  rstOfflineSendToKitchen: async (payload) => {
    h.sends.push(payload);
    return { printOk: payload.printOnServer ? true : Boolean(payload.printerName), printOnServer: payload.printOnServer };
  },
}));

vi.mock('../../../../src/restaurant/pos/utils/desktopPrinters', () => ({
  listDesktopPrintersCached: async () => h.printers,
  isDesktopPrinter: () => true,
  getDesktopPrinterSettings: async () => ({ stationPrinters: {} }),
}));

vi.mock('../../../../src/restaurant/pos/utils/buildLocalKitchenSendGroups', () => ({
  buildLocalKitchenSendGroups: async () => ({
    groups: [
      { printerName: 'Shashlik', categoryName: 'SHASHLIK', items: [{ name: 'A', qty: 1 }] },
      { printerName: 'KASSA', categoryName: 'ICHIMLIKLAR', items: [{ name: 'B', qty: 1 }] },
    ],
  }),
}));

import { sendKitchenLocalFirst } from '../../../../src/restaurant/pos/utils/sendKitchenLocalFirst';

describe('sendKitchenLocalFirst satellite vs hub', () => {
  beforeEach(() => {
    h.localFirst = true;
    h.printers = [];
    h.sends = [];
  });

  it('routes all groups to printOnServer when this PC has no printers', async () => {
    const res = await sendKitchenLocalFirst({
      order: { id: 'o1', tableId: 1 },
      storeId: 1,
    });
    expect(res.needsRelay).toBe(true);
    expect(res.printFailed).toBe(false);
    expect(h.sends).toHaveLength(2);
    expect(h.sends.every((s) => s.printOnServer === true)).toBe(true);
  });

  it('prints locally only for printers installed on this Windows', async () => {
    h.printers = [{ name: 'KASSA' }];
    const res = await sendKitchenLocalFirst({
      order: { id: 'o1', tableId: 1 },
      storeId: 1,
    });
    expect(res.needsRelay).toBe(true);
    expect(res.printFailed).toBe(false);
    expect(h.sends.find((s) => s.printerName === 'KASSA')?.printOnServer).toBe(false);
    expect(h.sends.find((s) => s.printerName === 'Shashlik')?.printOnServer).toBe(true);
  });
});
