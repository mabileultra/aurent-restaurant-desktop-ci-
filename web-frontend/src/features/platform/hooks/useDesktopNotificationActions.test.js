import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import { useDesktopNotificationActions } from './useDesktopNotificationActions';
import { platformDesktopNotificationsApi } from '../../../api';

globalThis.React = React;

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../api', () => ({
  platformDesktopNotificationsApi: {
    extend: vi.fn(),
    revoke: vi.fn(),
  },
}));

describe('useDesktopNotificationActions', () => {
  const mockQueryClient = {
    invalidateQueries: vi.fn(),
  };
  const mockT = (k, opts) => opts?.defaultValue || k;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderHookHelper(props = {}) {
    let hookResult = null;
    function TestComponent() {
      hookResult = useDesktopNotificationActions({
        queryClient: mockQueryClient,
        t: mockT,
        setTitle: vi.fn(),
        setBody: vi.fn(),
        setKind: vi.fn(),
        ...props,
      });
      return React.createElement('div', null, 'OK');
    }

    renderToStaticMarkup(React.createElement(TestComponent));
    return hookResult;
  }

  it('prevents extending expired notification', async () => {
    const hook = renderHookHelper();

    await hook.handleExtend({
      id: 'expired-1',
      status: 'EXPIRED',
      expiresAt: new Date(Date.now() - 3600000).toISOString(),
    });

    expect(platformDesktopNotificationsApi.extend).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Muddati tugagan xabarni uzaytirib bo‘lmaydi');
  });

  it('extends active notification with calculated future date', async () => {
    const hook = renderHookHelper();

    platformDesktopNotificationsApi.extend.mockResolvedValueOnce({ data: { success: true } });

    const futureDate = new Date(Date.now() + 5 * 86400000);
    await hook.handleExtend({
      id: 'active-1',
      status: 'ACTIVE',
      expiresAt: futureDate.toISOString(),
    });

    expect(platformDesktopNotificationsApi.extend).toHaveBeenCalledTimes(1);
    const [id, payload] = platformDesktopNotificationsApi.extend.mock.calls[0];
    expect(id).toBe('active-1');
    expect(payload.expiresInHours).toBe(24);
    const payloadExpiryTime = new Date(payload.expiresAt).getTime();
    expect(payloadExpiryTime).toBeGreaterThan(futureDate.getTime());
    expect(toast.success).toHaveBeenCalledWith('Xabar muddati 24 soatga uzaytirildi');
  });

  it('prevents revoking expired notification', async () => {
    const hook = renderHookHelper();

    await hook.handleRevoke({
      id: 'expired-1',
      status: 'EXPIRED',
    });

    expect(platformDesktopNotificationsApi.revoke).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Muddati tugagan xabarni olib tashlab bo‘lmaydi');

    hook.handleRevokePrompt({
      id: 'expired-1',
      status: 'EXPIRED',
    });
    expect(hook.revokeConfirmItem).toBeNull();
  });

  it('revokes active notification successfully', async () => {
    const hook = renderHookHelper();

    platformDesktopNotificationsApi.revoke.mockResolvedValueOnce({ data: { success: true } });

    await hook.handleRevoke({
      id: 'active-1',
      status: 'ACTIVE',
    });

    expect(platformDesktopNotificationsApi.revoke).toHaveBeenCalledWith('active-1');
    expect(toast.success).toHaveBeenCalledWith('Xabar kassalardan olib tashlandi');
  });
});
