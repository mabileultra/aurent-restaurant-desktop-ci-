import { describe, expect, it } from 'vitest';
import {
  applyPharmacyImportRoleChange,
  buildPharmacyImportRoleMap,
} from './pharmacyImportRoleMap';

describe('pharmacyImportRoleMap', () => {
  it('sends exact column index after user remaps VAT column to RETAIL', () => {
    let roles = {
      0: 'NAME',
      4: 'VAT_RATE',
      5: 'SKIP',
      10: 'RETAIL',
    };
    roles = applyPharmacyImportRoleChange(roles, 10, 'SKIP');
    roles = applyPharmacyImportRoleChange(roles, 4, 'RETAIL');
    roles = applyPharmacyImportRoleChange(roles, 5, 'VAT_RATE');

    const map = buildPharmacyImportRoleMap(roles);
    expect(map.RETAIL).toBe(4);
    expect(map.VAT_RATE).toBe(5);
    expect(map.NAME).toBe(0);
  });

  it('keeps only one column per role', () => {
    let roles = { 7: 'PURCHASE', 10: 'RETAIL' };
    roles = applyPharmacyImportRoleChange(roles, 11, 'RETAIL');
    expect(roles[10]).toBe('SKIP');
    expect(roles[11]).toBe('RETAIL');
    expect(buildPharmacyImportRoleMap(roles).RETAIL).toBe(11);
  });
});
