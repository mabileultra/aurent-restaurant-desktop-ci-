import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useViloyatlarAnalytics } from './useViloyatlarAnalytics';

globalThis.React = React;

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: () => ({
      data: {
        periodFrom: '2026-10-10',
        periodTo: '2026-11-08',
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
  };
});

describe('useViloyatlarAnalytics', () => {
  it('loads Samarqand districts, computes 4 KPIs and filters active/empty counts', () => {
    let hookState;
    function TestComponent() {
      hookState = useViloyatlarAnalytics();
      return React.createElement('div', null, hookState.rangeLabel);
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(hookState.loading).toBe(false);
    expect(hookState.rangeLabel).toBe('10-okt – 8-noy');
    expect(hookState.counts.all).toBe(16);
    expect(hookState.counts.active).toBe(10);
    expect(hookState.counts.empty).toBe(6);
    expect(hookState.totalCompanies).toBe(63);

    const samSh = hookState.regions.find((r) => r.code === '01');
    expect(samSh).toBeDefined();
    expect(samSh.name).toBe('Samarqand shahri');
    expect(samSh.companies).toBe(36);
    expect(samSh.connected).toBe(13);
    expect(samSh.hasCompanies).toBe(true);

    const ishtixon = hookState.regions.find((r) => r.code === '05');
    expect(ishtixon).toBeDefined();
    expect(ishtixon.name).toBe('Ishtixon tumani');

    const jomboy = hookState.regions.find((r) => r.code === '04');
    expect(jomboy).toBeDefined();
    expect(jomboy.name).toBe('Jomboy tumani');

    expect(hookState.kpis.length).toBe(4);
  });
});
