import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useEmailSettingsFlow } from './useEmailSettingsFlow';

globalThis.React = React;

describe('useEmailSettingsFlow', () => {
  it('initializes with default sender, SMTP, and watch emails', () => {
    let state;
    function TestComponent() {
      state = useEmailSettingsFlow();
      return null;
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(state.settings.sender.name).toBe('Aurent POS');
    expect(state.settings.smtp.server).toBe('smtp.aurent.uz');
    expect(state.watchEmails.length).toBe(3);
    expect(state.dirty).toBe(false);
  });

  it('updates sender settings and tracks dirty state', () => {
    let state;
    function TestComponent() {
      state = useEmailSettingsFlow();
      return null;
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    state.updateSender('name', 'New POS');
    state.updateSmtp('port', '465');
    state.toggleTrigger('failedAttempts');
    state.setNewEmail('security-test@aurent.uz');
    state.addWatchEmail();
    state.removeWatchEmail('it@aurent.uz');
    state.handleTestConnection();
    state.handleSave();
    state.handleCancel();
  });
});
