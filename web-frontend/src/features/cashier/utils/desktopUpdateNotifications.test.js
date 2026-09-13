import { describe, expect, it } from 'vitest';
import {
  classifyUpdaterError,
  isBenignUpdaterMessage,
  mapDesktopUpdateEvent,
  mergeDesktopUpdateItem,
} from './desktopUpdateNotifications';

describe('desktopUpdateNotifications', () => {
  it('swallows macOS unsigned signature noise', () => {
    expect(isBenignUpdaterMessage('Could not get code signature for running application')).toBe(true);
    expect(classifyUpdaterError('Could not get code signature for running application')).toBe('signature');
    expect(mapDesktopUpdateEvent({
      type: 'error',
      message: 'Could not get code signature for running application',
    })).toEqual({ skip: true });
  });

  it('keeps a single update card through available → downloaded', () => {
    const available = mapDesktopUpdateEvent({ type: 'available', version: '1.2.8' });
    const downloaded = mapDesktopUpdateEvent({ type: 'downloaded', version: '1.2.8' });
    const merged = mergeDesktopUpdateItem(
      mergeDesktopUpdateItem([], available),
      downloaded,
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].updateState).toBe('downloaded');
    expect(merged[0].actionKey).toBe('notifications.restartNow');
  });

  it('does not replace a ready update with available or signature error', () => {
    const ready = mergeDesktopUpdateItem(
      [],
      mapDesktopUpdateEvent({ type: 'downloaded', version: '1.2.8' }),
    );
    const afterAvailable = mergeDesktopUpdateItem(
      ready,
      mapDesktopUpdateEvent({ type: 'available', version: '1.2.8' }),
    );
    const afterError = mergeDesktopUpdateItem(
      afterAvailable,
      mapDesktopUpdateEvent({ type: 'error', message: 'Could not get code signature for running application' }),
    );
    expect(afterError).toHaveLength(1);
    expect(afterError[0].updateState).toBe('downloaded');
  });

  it('maps network errors to a localized card', () => {
    const mapped = mapDesktopUpdateEvent({ type: 'error', message: 'net::ERR_INTERNET_DISCONNECTED' });
    expect(mapped.skip).toBeUndefined();
    expect(mapped.updateState).toBe('error');
    expect(mapped.bodyKey).toBe('notifications.updateErrorNetwork');
    expect(mapped.actionKey).toBe('notifications.retryUpdate');
  });
});
