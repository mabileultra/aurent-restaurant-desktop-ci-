import { describe, expect, it } from 'vitest';
import { FISCAL_PROVIDER } from '../../services/fiscal';
import { resolveCashierFiscalTheme } from './resolveCashierFiscalTheme';

describe('resolveCashierFiscalTheme', () => {
  it('FiscalDrive — отдельная тема, не Multikassa', () => {
    expect(resolveCashierFiscalTheme({ fiscalProvider: 'FISCAL_DRIVE' }))
      .toBe(FISCAL_PROVIDER.FISCAL_DRIVE);
  });

  it('Multikassa и пустой провайдер — тема Multikassa', () => {
    expect(resolveCashierFiscalTheme({ enabled: true })).toBe(FISCAL_PROVIDER.MULTIKASSA);
    expect(resolveCashierFiscalTheme({ fiscalProvider: 'MULTIKASSA' }))
      .toBe(FISCAL_PROVIDER.MULTIKASSA);
    expect(resolveCashierFiscalTheme(null)).toBe(FISCAL_PROVIDER.MULTIKASSA);
  });
});
