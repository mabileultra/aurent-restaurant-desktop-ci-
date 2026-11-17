// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import PlatformCompaniesStatusTabs from './PlatformCompaniesStatusTabs';

describe('PlatformCompaniesStatusTabs', () => {
  afterEach(cleanup);
  const t = (key, opt) => opt?.defaultValue || key;

  it('renders all tabs with correct counts', () => {
    const onStatusFilterChange = vi.fn();
    const { container } = render(
      <PlatformCompaniesStatusTabs
        statusFilter="ALL"
        onStatusFilterChange={onStatusFilterChange}
        totalCompanies={42}
        activeCompanies={30}
        inactiveCompanies={12}
        t={t}
      />
    );

    expect(screen.getByText('Barchasi')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('Faol')).toBeTruthy();
    expect(screen.getByText('30')).toBeTruthy();
    expect(screen.getByText('Nofaol')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('calls onStatusFilterChange when clicked', () => {
    const onStatusFilterChange = vi.fn();
    render(
      <PlatformCompaniesStatusTabs
        statusFilter="ALL"
        onStatusFilterChange={onStatusFilterChange}
        totalCompanies={10}
        activeCompanies={8}
        inactiveCompanies={2}
        t={t}
      />
    );

    fireEvent.click(screen.getByText('Faol'));
    expect(onStatusFilterChange).toHaveBeenCalledWith('ACTIVE');

    fireEvent.click(screen.getByText('Nofaol'));
    expect(onStatusFilterChange).toHaveBeenCalledWith('INACTIVE');
  });
});
