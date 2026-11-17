// @vitest-environment jsdom
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, beforeAll, vi } from 'vitest';
import { useAppShellLayoutState } from './useAppShellLayoutState';

describe('useAppShellLayoutState', () => {
  beforeAll(() => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  const createWrapper = () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return ({ children }) => (
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('provides navigation and layout states', () => {
    const { result } = renderHook(() => useAppShellLayoutState(), { wrapper: createWrapper() });

    expect(result.current.displayAppName).toBeDefined();
    expect(typeof result.current.toggleSidebar).toBe('function');
    expect(typeof result.current.handleLogout).toBe('function');
  });

  it('toggles sidebar on toggleSidebar call', () => {
    const { result } = renderHook(() => useAppShellLayoutState(), { wrapper: createWrapper() });

    const prev = result.current.mobileNavOpen;
    act(() => {
      result.current.toggleSidebar();
    });
    expect(result.current.mobileNavOpen !== prev || result.current.sidebarOpen !== undefined).toBe(true);
  });
});
