const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  usesOverlayTitlebar,
  browserWindowChromeOptions,
  TITLEBAR_HEIGHT,
} = require('../electron/runtime/windowTitlebar');

describe('windowTitlebar', () => {
  it('exports overlay height', () => {
    assert.equal(TITLEBAR_HEIGHT, 36);
  });

  it('chrome options keep autoHideMenuBar', () => {
    const opts = browserWindowChromeOptions();
    assert.equal(opts.autoHideMenuBar, true);
    if (usesOverlayTitlebar()) {
      assert.equal(opts.titleBarStyle, 'hidden');
      assert.equal(opts.titleBarOverlay.height, TITLEBAR_HEIGHT);
    }
  });
});
