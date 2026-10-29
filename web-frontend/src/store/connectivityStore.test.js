import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  markApiReachable,
  markApiUnreachable,
  resetConnectivityStabilizer,
  useConnectivityStore,
} from './connectivityStore';
import { OFFLINE_CONFIRM_MS } from './connectivityStabilizer';

function onlineState() {
  useConnectivityStore.setState({
    apiOnline: true,
    offlineMode: false,
    bootstrapReady: true,
    pendingSales: 0,
  });
}

function failProbe() {
  useConnectivityStore.getState().applyStatus({ apiOnline: false, offlineMode: true });
}

describe('connectivityStore applyStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetConnectivityStabilizer();
    onlineState();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetConnectivityStabilizer();
    onlineState();
  });

  it('короткий сбой и ложный offline браузера не переключают кассу', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    failProbe();
    vi.advanceTimersByTime(10_000);
    failProbe();
    expect(useConnectivityStore.getState().apiOnline).toBe(true);
    expect(useConnectivityStore.getState().offlineMode).toBe(false);
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  it('офлайн только после непрерывных сбоев дольше окна подтверждения', () => {
    failProbe();
    vi.advanceTimersByTime(OFFLINE_CONFIRM_MS);
    failProbe();
    expect(useConnectivityStore.getState().apiOnline).toBe(false);
    expect(useConnectivityStore.getState().offlineMode).toBe(true);
  });

  it('успешный ответ сбрасывает подозрение', () => {
    failProbe();
    vi.advanceTimersByTime(10_000);
    useConnectivityStore.getState().applyStatus({ apiOnline: true });
    vi.advanceTimersByTime(10_000);
    failProbe();
    expect(useConnectivityStore.getState().apiOnline).toBe(true);
  });

  it('один успешный probe сразу после офлайна не возвращает онлайн', () => {
    failProbe();
    vi.advanceTimersByTime(OFFLINE_CONFIRM_MS);
    failProbe();
    markApiReachable();
    expect(useConnectivityStore.getState().apiOnline).toBe(false);
    markApiReachable();
    expect(useConnectivityStore.getState().apiOnline).toBe(true);
  });

  it('markApiUnreachable не ставит офлайн с первого сбоя', () => {
    markApiUnreachable();
    expect(useConnectivityStore.getState().apiOnline).toBe(true);
    expect(useConnectivityStore.getState().offlineMode).toBe(false);
  });
});
