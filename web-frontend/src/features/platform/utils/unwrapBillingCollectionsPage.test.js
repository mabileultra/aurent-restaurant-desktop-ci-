import { describe, expect, it } from 'vitest';
import { unwrapBillingCollectionsPage } from './unwrapBillingCollectionsPage';

describe('unwrapBillingCollectionsPage', () => {
  it('keeps legacy array responses usable', () => {
    const rows = [{ billing: { companyId: 1 } }];
    expect(unwrapBillingCollectionsPage(rows)).toEqual({
      content: rows,
      totalElements: 1,
      totalPages: 1,
      size: 1,
      number: 0,
    });
  });

  it('reads Spring PageResponse fields', () => {
    const page = {
      content: [{ billing: { companyId: 2 } }],
      totalElements: 25,
      totalPages: 3,
      size: 10,
      number: 1,
    };
    expect(unwrapBillingCollectionsPage(page)).toEqual(page);
  });
});
