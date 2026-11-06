import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ConnectionStatus, useNetworkStore } from './networkStore';

describe('networkStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useNetworkStore.getState().setStatus(ConnectionStatus.ONLINE);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default status', () => {
    const status = useNetworkStore.getState().status;
    expect(status).toBe(ConnectionStatus.ONLINE);
  });

  it('updates status explicitly via setStatus', () => {
    useNetworkStore.getState().setStatus(ConnectionStatus.OFFLINE);
    expect(useNetworkStore.getState().status).toBe(ConnectionStatus.OFFLINE);

    useNetworkStore.getState().setStatus(ConnectionStatus.SERVER_DOWN);
    expect(useNetworkStore.getState().status).toBe(ConnectionStatus.SERVER_DOWN);
  });

  it('does NOT set RECONNECTED if user was already ONLINE when probe succeeds', async () => {
    useNetworkStore.getState().setStatus(ConnectionStatus.ONLINE);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }));

    const result = await useNetworkStore.getState().checkConnection();
    expect(result).toBe(true);
    expect(useNetworkStore.getState().status).toBe(ConnectionStatus.ONLINE);
  });

  it('transitions to RECONNECTED when previously OFFLINE and probe succeeds', async () => {
    useNetworkStore.getState().setStatus(ConnectionStatus.OFFLINE);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }));

    const result = await useNetworkStore.getState().checkConnection();
    expect(result).toBe(true);
    expect(useNetworkStore.getState().status).toBe(ConnectionStatus.RECONNECTED);
  });

  it('transitions to RECONNECTED when previously SERVER_DOWN and probe succeeds', async () => {
    useNetworkStore.getState().setStatus(ConnectionStatus.SERVER_DOWN);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }));

    const result = await useNetworkStore.getState().checkConnection();
    expect(result).toBe(true);
    expect(useNetworkStore.getState().status).toBe(ConnectionStatus.RECONNECTED);
  });

  it('does NOT flip status to CHECKING during probe when already SERVER_DOWN to prevent flickering and button unblocking', async () => {
    useNetworkStore.getState().setStatus(ConnectionStatus.SERVER_DOWN);
    let capturedStatusDuringProbe = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
      capturedStatusDuringProbe = useNetworkStore.getState().status;
      return { status: 503 };
    }));

    await useNetworkStore.getState().checkConnection();
    expect(capturedStatusDuringProbe).toBe(ConnectionStatus.SERVER_DOWN);
    expect(useNetworkStore.getState().status).toBe(ConnectionStatus.SERVER_DOWN);
  });

  it('dismisses reconnected status immediately', () => {
    useNetworkStore.getState().setStatus(ConnectionStatus.OFFLINE);
    useNetworkStore.getState().setStatus(ConnectionStatus.RECONNECTED);
    expect(useNetworkStore.getState().status).toBe(ConnectionStatus.RECONNECTED);

    useNetworkStore.getState().dismissReconnected();
    expect(useNetworkStore.getState().status).toBe(ConnectionStatus.ONLINE);
  });
});
