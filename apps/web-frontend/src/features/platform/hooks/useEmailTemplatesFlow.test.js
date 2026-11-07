import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useEmailTemplatesFlow } from './useEmailTemplatesFlow';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: { language: 'uz' },
  }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: () => ({ data: null, isLoading: false }),
  };
});

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
