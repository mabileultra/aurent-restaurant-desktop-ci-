import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformUserStatsCards from './PlatformUserStatsCards';

globalThis.React = React;

describe('PlatformUserStatsCards', () => {
  const mockT = (key, opts) => opts?.defaultValue || key;

  const defaultProps = {
    t: mockT,
    totalUsers: 319,
    activeUsers: 310,
    inactiveUsers: 9,
    adminUsers: 45,
    staffUsers: 274,
    statusFilter: 'ALL',
    roleFilter: 'ALL',
    onStatusFilterChange: vi.fn(),
    onRoleFilterChange: vi.fn(),
    isPending: false,
  };

  it('renders 4 KPI stats cards with correct labels and formatted numbers', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformUserStatsCards, defaultProps)
    );

    expect(html).toContain('Jami foydalanuvchilar');
    expect(html).toContain('Faol foydalanuvchilar');
    expect(html).toContain('Boshqaruv xodimlari');
    expect(html).toContain('Kassa va Operatsiya');

    expect(html).toContain('319');
    expect(html).toContain('310');
    expect(html).toContain('45');
    expect(html).toContain('274');
  });

  it('applies active ring on total card when both status and role filters are ALL', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformUserStatsCards, {
        ...defaultProps,
        statusFilter: 'ALL',
        roleFilter: 'ALL',
      })
    );

    expect(html).toContain('ring-2 ring-slate-400');
  });

  it('applies emerald active ring on active users card when statusFilter is ACTIVE', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformUserStatsCards, {
        ...defaultProps,
        statusFilter: 'ACTIVE',
      })
    );

    expect(html).toContain('ring-2 ring-emerald-500/80');
  });

  it('applies purple active ring on management card when roleFilter is MANAGEMENT', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformUserStatsCards, {
        ...defaultProps,
        roleFilter: 'MANAGEMENT',
      })
    );

    expect(html).toContain('ring-2 ring-purple-500/80');
  });

  it('applies sky active ring on staff card when roleFilter is STAFF', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformUserStatsCards, {
        ...defaultProps,
        roleFilter: 'STAFF',
      })
    );

    expect(html).toContain('ring-2 ring-sky-500/80');
  });
});
