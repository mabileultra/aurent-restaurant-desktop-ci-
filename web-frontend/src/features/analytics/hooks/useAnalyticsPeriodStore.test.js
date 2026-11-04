import { describe, expect, it } from 'vitest';
import { computePeriodLabels, useAnalyticsPeriodStore } from './useAnalyticsPeriodStore';

describe('computePeriodLabels', () => {
  it('computes 30d label properly', () => {
    const labels = computePeriodLabels('30d', '', '', '2026-10-06', '2026-11-04');
    expect(labels.currentLabel).toContain('6-okt – 4-noy');
    expect(labels.compareLabel).toContain('Taqqoslash: 6-sen – 5-okt');
  });

  it('computes 7d label properly', () => {
    const labels = computePeriodLabels('7d', '', '', '2026-10-29', '2026-11-04');
    expect(labels.currentLabel).toContain('29-okt – 4-noy');
    expect(labels.compareLabel).toContain('Taqqoslash: 22-okt – 28-okt');
  });

  it('computes year label properly', () => {
    const labels = computePeriodLabels('year');
    expect(labels.currentLabel).toContain('-yil');
    expect(labels.compareLabel).toContain('Taqqoslash:');
  });
});

describe('useAnalyticsPeriodStore', () => {
  it('updates period and clears custom dates', () => {
    useAnalyticsPeriodStore.getState().setCustomRange({ from: '2026-10-01', to: '2026-10-10' });
    expect(useAnalyticsPeriodStore.getState().period).toBe('custom');
    expect(useAnalyticsPeriodStore.getState().customFrom).toBe('2026-10-01');

    useAnalyticsPeriodStore.getState().setPeriod('7d');
    expect(useAnalyticsPeriodStore.getState().period).toBe('7d');
    expect(useAnalyticsPeriodStore.getState().customFrom).toBe('');
  });
});
