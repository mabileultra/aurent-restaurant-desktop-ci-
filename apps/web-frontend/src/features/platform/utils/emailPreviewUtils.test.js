import { describe, expect, it } from 'vitest';
import { getPreviewSamples } from './emailPreviewUtils';

describe('emailPreviewUtils', () => {
  const users = [
    { id: '1', name: 'Ali', role: 'Administrator', checked: true, company: 'XAN BALIQ' },
    { id: '2', name: 'Vali', role: 'Kassir', checked: false, company: 'DOSTON KAFE' },
  ];

  it('selects only checked users for manual mode', () => {
    const res = getPreviewSamples({ mode: 'manual', manualUsers: users });
    expect(res.samples).toHaveLength(1);
    expect(res.samples[0].name).toBe('Ali');
    expect(res.isDemo).toBe(false);
  });

  it('falls back to demo when no users are checked in manual mode', () => {
    const res = getPreviewSamples({
      mode: 'manual',
      manualUsers: users.map((u) => ({ ...u, checked: false })),
    });
    expect(res.isDemo).toBe(true);
    expect(res.samples).toHaveLength(1);
  });

  it('filters by active roles', () => {
    const res = getPreviewSamples({
      mode: 'role',
      manualUsers: users,
      roles: { CASHIER: true, ADMIN: false },
    });
    expect(res.samples[0].name).toBe('Vali');
    expect(res.isDemo).toBe(false);
  });

  it('filters by selected companies', () => {
    const res = getPreviewSamples({
      mode: 'company',
      manualUsers: users,
      selectedCompanies: new Set(['c2']),
    });
    expect(res.samples[0].name).toBe('Vali');
    expect(res.isDemo).toBe(false);
  });
});
