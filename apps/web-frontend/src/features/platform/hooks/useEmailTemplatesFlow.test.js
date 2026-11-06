import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useEmailTemplatesFlow } from './useEmailTemplatesFlow';

globalThis.React = React;

describe('useEmailTemplatesFlow', () => {
  it('provides default templates and language state', () => {
    let state;
    function TestComponent() {
      state = useEmailTemplatesFlow();
      return null;
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(state.templatesList.length).toBe(3);
    expect(state.selectedKey).toBe('USER_CREDENTIALS');
    expect(state.lang).toBe('uz');
    expect(state.currentTemplate.title).toBe('Kirish ma’lumotlari');
    expect(state.currentLangContent.subject).toContain('Aurent POS');
  });

  it('switches templates and updates fields', () => {
    let state;
    function TestComponent() {
      state = useEmailTemplatesFlow();
      return null;
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    state.setSelectedKey('SUPER_ADMIN_LOGIN');
    state.setLang('ru');
    state.handleUpdateField('subject', 'Новая тема');
    state.insertVariable('{{testVar}}');
    state.handleResetToDefault();
    state.handleSave();
    state.handleTestEmail();
  });
});
