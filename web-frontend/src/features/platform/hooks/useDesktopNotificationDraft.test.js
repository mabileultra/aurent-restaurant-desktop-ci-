import { describe, expect, it } from 'vitest';
import { DRAFT_STORAGE_KEY } from './useDesktopNotificationDraft';

describe('useDesktopNotificationDraft', () => {
  it('exports DRAFT_STORAGE_KEY constant', () => {
    expect(DRAFT_STORAGE_KEY).toBe('aurent_desktop_notification_draft_v1');
  });
});
