import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  markApiReachable,
  markApiUnreachable,
  resetConnectivityStabilizer,
  useConnectivityStore,
} from './connectivityStore';

function onlineState() {
  useConnectivityStore.setState({
    apiOnline: true,
    offlineMode: false,
    bootstrapReady: true,
    pendingSales: 0,
  });
}

describe('connectivityStore applyStatus', () => {
  beforeEach(() => {
    resetConnectivityStabilizer();
    onlineState();
  });

  afterEach(() => {
    resetConnectivityStabilizer();
    onlineState();
  });

  it('один сбой desktop probe не переключает кассу в офлайн', () => {
    useConnectivityStore.getState().applyStatus({ apiOnline: false, offlineMode: true });
    expect(useConnectivityStore.getState().apiOnline).toBe(true);
    expect(useConnectivityStore.getState().offlineMode).toBe(false);
  });

  it('два сбоя подряд включают офлайн', () => {
    useConnectivityStore.getState().applyStatus({ apiOnline: false, offlineMode: true });
    useConnectivityStore.getState().applyStatus({ apiOnline: false, offlineMode: true });
    expect(useConnectivityStore.getState().apiOnline).toBe(false);
    expect(useConnectivityStore.getState().offlineMode).toBe(true);
  });

  it('один успешный probe сразу после офлайна не возвращает онлайн', () => {
    useConnectivityStore.getState().applyStatus({ apiOnline: false, offlineMode: true });
    useConnectivityStore.getState().applyStatus({ apiOnline: false, offlineMode: true });
    markApiReachable();
    expect(useConnectivityStore.getState().apiOnline).toBe(false);
  });

  it('markApiUnreachable сразу ставит офлайн', () => {
    markApiUnreachable();
    expect(useConnectivityStore.getState().apiOnline).toBe(false);
    expect(useConnectivityStore.getState().offlineMode).toBe(true);
  });
});
