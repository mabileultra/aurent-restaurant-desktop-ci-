import { describe, expect, it } from 'vitest';
import {
  formatKitchenPlaceLine,
  isKitchenChannelPlaceLine,
  kitchenChannelDetailLines,
  kitchenChannelTitlePrefix,
} from '../../../../src/restaurant/pos/utils/kitchenPlaceLine';
import {
  formatKitchenOrderNoLine,
  kitchenTicketMetaLines,
  EMPH_LINE_PREFIX,
} from '../../../../src/restaurant/pos/utils/ticketLayout';
import { filterMetaLines } from '../../../../src/restaurant/shared/printProfile/applyPrintProfile';
import { factoryPrintProfile } from '../../../../src/restaurant/shared/printProfile/printProfileDefaults';

const t = (key, opts) => opts?.defaultValue || key;

describe('kitchenPlaceLine', () => {
  it('formats takeaway and delivery without burying order №', () => {
    expect(formatKitchenPlaceLine({
      order: { channel: 'TAKEAWAY', orderNo: 12, clientName: 'Ali' },
      t,
    })).toBe('НА ВЫНОС · Ali');
    expect(formatKitchenPlaceLine({
      order: { channel: 'DELIVERY', orderNo: 8 },
      t,
    })).toBe('ДОСТАВКА');
  });

  it('detects channel place lines including legacy English', () => {
    expect(isKitchenChannelPlaceLine('НА ВЫНОС · №3')).toBe(true);
    expect(isKitchenChannelPlaceLine('TAKEAWAY #3')).toBe(true);
    expect(isKitchenChannelPlaceLine('Asosiy · Стол 2')).toBe(false);
  });

  it('adds delivery phone and address under place line', () => {
    expect(kitchenChannelDetailLines({
      channel: 'DELIVERY',
      clientPhone: '+99890',
      deliveryAddress: 'ул. Навои 1',
    })).toEqual(['+99890', 'ул. Навои 1']);
    expect(kitchenChannelDetailLines({ channel: 'TAKEAWAY', clientPhone: '1' })).toEqual([]);
  });

  it('prefixes category / kitchen titles', () => {
    expect(kitchenChannelTitlePrefix('DELIVERY', t)).toBe('ДОСТАВКА · ');
    expect(kitchenChannelTitlePrefix('DINE_IN', t)).toBe('');
  });
});

describe('kitchen meta + print profile', () => {
  it('prints order № as its own huge line when orderNo field is on', () => {
    const profile = factoryPrintProfile();
    expect(formatKitchenOrderNoLine({ orderNo: 9 })).toBe('№9');
    const meta = kitchenTicketMetaLines({
      order: {
        channel: 'DELIVERY',
        orderNo: 9,
        clientName: 'Tim',
        clientPhone: '90',
        deliveryAddress: 'Address',
      },
      t,
    });
    expect(meta[0]).toBe('ДОСТАВКА · Tim');
    expect(meta[1]).toBe('№9');
    const filtered = filterMetaLines(meta, profile, 'KITCHEN');
    expect(filtered[0]).toContain('ДОСТАВКА');
    expect(filtered.some((l) => String(l).includes(`${EMPH_LINE_PREFIX}№9`))).toBe(true);
    expect(filtered.some((l) => String(l).includes('90'))).toBe(true);
  });

  it('hides order № when admin turns the field off', () => {
    const profile = factoryPrintProfile();
    profile.slips.KITCHEN.fields.orderNo.on = false;
    const meta = kitchenTicketMetaLines({
      order: { channel: 'TAKEAWAY', orderNo: 4, clientName: 'Bob' },
      t,
    });
    const filtered = filterMetaLines(meta, profile, 'KITCHEN');
    expect(filtered.some((l) => /№4/.test(String(l)))).toBe(false);
    expect(filtered[0]).toContain('НА ВЫНОС');
  });

  it('normalizes legacy English header from print job', () => {
    const lines = kitchenTicketMetaLines({
      order: { channel: 'TAKEAWAY', orderNo: 4, clientName: 'Bob' },
      header: 'TAKEAWAY #4',
      t,
    });
    expect(lines[0]).toBe('НА ВЫНОС · Bob');
    expect(lines[1]).toBe('№4');
  });
});
