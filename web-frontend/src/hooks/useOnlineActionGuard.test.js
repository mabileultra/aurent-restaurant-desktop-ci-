import { describe, expect, it } from 'vitest';
import { ConnectionStatus } from '../store/networkStore';
import { useOnlineActionGuard } from './useOnlineActionGuard';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

describe('useOnlineActionGuard', () => {
  it('allows actions when online', () => {
    let result;
    function TestComponent() {
      result = useOnlineActionGuard({ statusOverride: ConnectionStatus.ONLINE });
      return React.createElement('div', null, String(result.isActionBlocked));
    }
    renderToStaticMarkup(React.createElement(TestComponent));
    expect(result.isActionBlocked).toBe(false);
    expect(result.blockReason).toBe('');
  });

  it('blocks actions with reason when offline', () => {
    let result;
    function TestComponent() {
      result = useOnlineActionGuard({ statusOverride: ConnectionStatus.OFFLINE });
      return React.createElement('div', null, String(result.isActionBlocked));
    }
    renderToStaticMarkup(React.createElement(TestComponent));
    expect(result.isActionBlocked).toBe(true);
    expect(result.blockReason).toContain('Internet yo’q');
  });

  it('blocks actions with reason when server is down', () => {
    let result;
    function TestComponent() {
      result = useOnlineActionGuard({ statusOverride: ConnectionStatus.SERVER_DOWN });
      return React.createElement('div', null, String(result.isActionBlocked));
    }
    renderToStaticMarkup(React.createElement(TestComponent));
    expect(result.isActionBlocked).toBe(true);
    expect(result.blockReason).toContain('Server bilan aloqa yo’q');
  });
});
