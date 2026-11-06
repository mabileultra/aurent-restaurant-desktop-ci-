import { describe, expect, it } from 'vitest';
import {
  classifyUpdaterError,
  isBenignUpdaterMessage,
  mapDesktopUpdateEvent,
  mergeDesktopUpdateState,
} from '../../../src/services/desktop/desktopUpdateNotifications';

describe('restaurant desktopUpdateNotifications', () => {
  it('swallows unsigned signature noise', () => {
    expect(isBenignUpdaterMessage('Could not get code signature for running application')).toBe(true);
    expect(classifyUpdaterError('Could not get code signature for running application')).toBe('signature');
    expect(mapDesktopUpdateEvent({
      type: 'error',
      message: 'Could not get code signature for running application',
    })).toEqual({ skip: true });
  });

  it('keeps a single update through available → downloaded', () => {
    const available = mapDesktopUpdateEvent({ type: 'available', version: '1.2.8' });
    const downloaded = mapDesktopUpdateEvent({ type: 'downloaded', version: '1.2.8' });
    const merged = mergeDesktopUpdateState(
      mergeDesktopUpdateState(null, available),
      downloaded,
    );
    expect(merged.updateState).toBe('downloaded');
    expect(merged.actionKey).toBe('rst.cashier.updateRestartNow');
  });

  it('maps available to progress@0 so UI leaves «начинается» idle state', () => {
    const mapped = mapDesktopUpdateEvent({ type: 'available', version: '1.2.18' });
    expect(mapped.updateState).toBe('progress');
    expect(mapped.percent).toBe(0);
    expect(mapped.bodyKey).toBe('rst.cashier.updateDownloadStarting');
  });

  it('does not replace ready update with available/progress@0', () => {
    const ready = mergeDesktopUpdateState(
      null,
      mapDesktopUpdateEvent({ type: 'downloaded', version: '1.2.8' }),
    );
    const after = mergeDesktopUpdateState(
      ready,
      mapDesktopUpdateEvent({ type: 'available', version: '1.2.8' }),
    );
    expect(after.updateState).toBe('downloaded');
  });

  it('maps network errors', () => {
    const mapped = mapDesktopUpdateEvent({ type: 'error', message: 'net::ERR_INTERNET_DISCONNECTED' });
    expect(mapped.updateState).toBe('error');
    expect(mapped.bodyKey).toBe('rst.cashier.updateErrorNetwork');
  });
});
