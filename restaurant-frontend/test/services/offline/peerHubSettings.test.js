import { beforeEach, describe, expect, it } from 'vitest';
import {
  getPeerHubUrl,
  isPeerHubAutoSync,
  setPeerHubAutoSync,
  setPeerHubUrl,
} from '../../../src/services/offline/peerHubSettings';
import { setConfiguredHubUrl } from '../../../src/services/offline/waiterPwa/outboxSync';

describe('peerHubSettings multi-terminal', () => {
  beforeEach(() => {
    globalThis.localStorage = {
      _m: new Map(),
      getItem(k) { return this._m.has(k) ? this._m.get(k) : null; },
      setItem(k, v) { this._m.set(k, String(v)); },
      removeItem(k) { this._m.delete(k); },
    };
  });

  it('falls back to waiter LAN hub URL for main PC pull', () => {
    setConfiguredHubUrl('http://192.168.1.244:8787');
    expect(getPeerHubUrl()).toBe('http://192.168.1.244:8787');
  });

  it('auto-sync defaults on when hub URL exists', () => {
    setConfiguredHubUrl('http://192.168.1.244:8787');
    expect(isPeerHubAutoSync()).toBe(true);
  });

  it('explicit off disables auto-sync', () => {
    setPeerHubUrl('http://192.168.1.244:8787');
    setPeerHubAutoSync(false);
    expect(isPeerHubAutoSync()).toBe(false);
  });
});
