import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformSecurityPage from './PlatformSecurityPage';
import { SECURITY_TAB_KEYS } from '../utils/securityConstants';

globalThis.React = React;

let mockPageState = {};

vi.mock('../hooks/usePlatformSecurityPage', () => ({
  usePlatformSecurityPage: () => mockPageState,
}));

vi.mock('../../../components/ui', () => ({
  PageLayout: ({ children, className }) => React.createElement('div', { className }, children),
}));

vi.mock('../components/security/PlatformSecurityHeader', () => ({
  default: ({ onOpenCreateStaff, onGoToRules, onOpen2fa }) =>
    React.createElement('div', { 'data-testid': 'security-header' }, [
      React.createElement('button', { key: 'create-btn', onClick: onOpenCreateStaff }, 'Yangi xodim'),
      React.createElement('button', { key: 'rules-btn', onClick: onGoToRules }, 'Qoidalar'),
      React.createElement('button', { key: '2fa-btn', onClick: onOpen2fa }, '2FA'),
    ]),
}));

vi.mock('../components/security/PlatformSecurityTabsNav', () => ({
  default: ({ activeTab, onSelectTab, staffCount }) =>
    React.createElement('div', { 'data-testid': 'tabs-nav', 'data-active': activeTab }, `Tabs (${staffCount})`),
}));

vi.mock('../components/security/PlatformSecurityOverviewTab', () => ({
  default: () => React.createElement('div', { 'data-testid': 'tab-overview' }, 'Umumiy holat'),
}));

vi.mock('../components/security/PlatformSecuritySessionsTab', () => ({
  default: () => React.createElement('div', { 'data-testid': 'tab-sessions' }, 'Kirishlar'),
}));

vi.mock('../components/security/PlatformSecurityAuditTab', () => ({
  default: () => React.createElement('div', { 'data-testid': 'tab-audit' }, 'Jurnal'),
}));

vi.mock('../components/security/PlatformSecurityStaffTab', () => ({
  default: () => React.createElement('div', { 'data-testid': 'tab-staff' }, 'Xodimlar tabi'),
}));

vi.mock('../components/security/PlatformSecurityRulesTab', () => ({
  default: () => React.createElement('div', { 'data-testid': 'tab-rules' }, 'Qoidalar'),
}));

vi.mock('../components/security/PlatformSecurityStaffDrawer', () => ({
  default: ({ form, onClose }) =>
    form
      ? React.createElement('div', { 'data-testid': 'staff-drawer', role: 'dialog' }, [
          React.createElement('span', { key: 'title' }, form.mode === 'create' ? 'Yangi xodim' : 'Tahrirlash'),
          React.createElement('button', { key: 'close', onClick: onClose }, 'Bekor qilish'),
        ])
      : null,
}));

vi.mock('../components/security/PlatformSecurityCloseSessionModal', () => ({
  default: () => null,
}));

vi.mock('../components/security/PlatformSecuritySudoModal', () => ({
  default: () => null,
}));

vi.mock('../components/security/PlatformSecurity2faModal', () => ({
  default: () => null,
}));

function createMockPage(overrides = {}) {
  let activeTab = overrides.activeTab || SECURITY_TAB_KEYS.OVERVIEW;
  let form = overrides.form || null;

  const setActiveTab = vi.fn((tab) => {
    activeTab = tab;
    mockPageState.activeTab = tab;
  });

  const openCreate = vi.fn(() => {
    form = { mode: 'create', username: '', role: 'OPERATOR' };
    mockPageState.staffFlow.form = form;
  });

  const closeForm = vi.fn(() => {
    form = null;
    mockPageState.staffFlow.form = null;
  });

  mockPageState = {
    activeTab,
    setActiveTab,
    staffFlow: {
      form,
      openCreate,
      closeForm,
      updateField: vi.fn(),
      handleSubmit: vi.fn(),
      isSaving: false,
      currentTempPassword: 'temp-password-123',
      cycleTempPassword: vi.fn(),
      staffList: [{ id: 1, username: 'admin' }],
    },
    overviewFlow: {},
    sessionsFlow: { pendingCloseSession: null, isCloseAllPending: false },
    auditFlow: {},
    rulesFlow: { isSudoModalOpen: false, isSavingRules: false },
    ...overrides,
  };

  return { setActiveTab, openCreate, closeForm };
}

describe('PlatformSecurityPage', () => {
  it('renders correctly and switches tab to STAFF while opening form from header', () => {
    const { setActiveTab, openCreate } = createMockPage({ activeTab: SECURITY_TAB_KEYS.OVERVIEW });

    const htmlInitial = renderToStaticMarkup(React.createElement(PlatformSecurityPage));
    expect(htmlInitial).toContain('data-testid="tab-overview"');
    expect(htmlInitial).not.toContain('data-testid="staff-drawer"');

    // Sarlavhadagi "Yangi xodim" tugmasi chaqirilishi simulatsiyasi
    mockPageState.setActiveTab(SECURITY_TAB_KEYS.STAFF);
    mockPageState.staffFlow.openCreate();

    expect(setActiveTab).toHaveBeenCalledWith(SECURITY_TAB_KEYS.STAFF);
    expect(openCreate).toHaveBeenCalled();

    const htmlOpened = renderToStaticMarkup(React.createElement(PlatformSecurityPage));
    expect(htmlOpened).toContain('data-testid="staff-drawer"');
    expect(htmlOpened).toContain('Yangi xodim');
    expect(htmlOpened).toContain('data-testid="tab-staff"');
  });

  it('renders staff drawer even if opened from another tab (OVERVIEW) at page level', () => {
    createMockPage({
      activeTab: SECURITY_TAB_KEYS.OVERVIEW,
      form: { mode: 'create', username: '' },
    });

    const html = renderToStaticMarkup(React.createElement(PlatformSecurityPage));
    // Drawer sahifa darajasida har qanday faol tabda ochiladi
    expect(html).toContain('data-testid="tab-overview"');
    expect(html).toContain('data-testid="staff-drawer"');
    expect(html).toContain('role="dialog"');
  });

  it('does not re-open staff drawer when navigating between tabs after cancel', () => {
    const { closeForm } = createMockPage({
      activeTab: SECURITY_TAB_KEYS.STAFF,
      form: { mode: 'create' },
    });

    // Avval drawer ko‘rinadi
    let html = renderToStaticMarkup(React.createElement(PlatformSecurityPage));
    expect(html).toContain('data-testid="staff-drawer"');

    // Bekor qilish bosiladi
    mockPageState.staffFlow.closeForm();
    expect(closeForm).toHaveBeenCalled();

    // Drawer endi ko‘rinmaydi
    html = renderToStaticMarkup(React.createElement(PlatformSecurityPage));
    expect(html).not.toContain('data-testid="staff-drawer"');

    // Boshqa tabga (Umumiy holat) o‘tilganda ham forma yopiq qoladi
    mockPageState.activeTab = SECURITY_TAB_KEYS.OVERVIEW;
    html = renderToStaticMarkup(React.createElement(PlatformSecurityPage));
    expect(html).not.toContain('data-testid="staff-drawer"');
  });
});
