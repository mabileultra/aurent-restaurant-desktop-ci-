import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/restaurant/pos/utils/desktopPrinters', () => ({
  isDesktopPrinter: () => true,
  getDesktopPrinterSettings: async () => ({
    stationPrinters: { hot: 'Oshxona' },
  }),
}));

import { buildLocalKitchenSendGroups } from '../../../src/restaurant/pos/utils/buildLocalKitchenSendGroups.js';

describe('buildLocalKitchenSendGroups', () => {
  it('groups pending lines by station printer', async () => {
    const { groups, error } = await buildLocalKitchenSendGroups({
      items: [
        { id: '1', name: 'Кола', quantity: 2, sentQuantity: 0, stationId: 'hot' },
        { id: '2', name: 'Бургер', quantity: 1, sentQuantity: 1, stationId: 'hot' },
      ],
    });
    expect(error).toBeUndefined();
    expect(groups).toHaveLength(1);
    expect(groups[0].printerName).toBe('Oshxona');
    expect(groups[0].items).toHaveLength(1);
    expect(groups[0].items[0].qty).toBe(2);
  });

  it('uses category autoPrint printer when set', async () => {
    const { groups } = await buildLocalKitchenSendGroups(
      {
        items: [
          { id: '1', name: 'Салат', quantity: 1, sentQuantity: 0, categoryId: 'c1' },
        ],
      },
      [{ id: 'c1', name: 'Salat', autoPrint: true, printPrinterName: 'Salat' }],
    );
    expect(groups[0].printerName).toBe('Salat');
    expect(groups[0].categoryName).toBe('Salat');
  });
});
