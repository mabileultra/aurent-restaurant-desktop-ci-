import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AccessRightsTemplateEditorHeader from './templates/AccessRightsTemplateEditorHeader';
import AccessRightsHistoryFiltersBar from './history/AccessRightsHistoryFiltersBar';
import AccessRightsStaffBulkBar from './staff/AccessRightsStaffBulkBar';
import AccessRightsHeader from './AccessRightsHeader';
import { getScopeForRole } from './utils/roleDefaultModules';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'uz' },
  }),
}));

describe('Access Rights Extended Audit Bug Fixes', () => {
  it('AccessRightsTemplateEditorHeader displays "O‘zgartirilgan shablon" instead of "andoza" when modified', () => {
    const html = renderToStaticMarkup(
      React.createElement(AccessRightsTemplateEditorHeader, {
        businessTypeName: 'Restoran',
        roleName: 'Oshpaz',
        templateSource: 'TEMPLATE',
        isModified: true,
        enabledModulesCount: 10,
        totalModulesCount: 10,
        employeesCount: 3,
        exceptionsCount: 0,
        isRu: false,
      })
    );

    expect(html).toContain('O‘zgartirilgan shablon');
    expect(html).not.toContain('andoza');
  });

  it('AccessRightsTemplateEditorHeader displays "Standart (tizim)" when values equal standard defaults', () => {
    const html = renderToStaticMarkup(
      React.createElement(AccessRightsTemplateEditorHeader, {
        businessTypeName: 'Restoran',
        roleName: 'Oshpaz',
        templateSource: 'TEMPLATE',
        isModified: false,
        enabledModulesCount: 10,
        totalModulesCount: 10,
        employeesCount: 3,
        exceptionsCount: 0,
        isRu: false,
      })
    );

    expect(html).toContain('Standart (tizim)');
    expect(html).not.toContain('O‘zgartirilgan shablon');
  });

  it('AccessRightsHistoryFiltersBar includes "Qaytarish" chip matching revert count', () => {
    const counts = { all: 2, template: 0, exception: 1, copy: 0, bulk: 0, revert: 1 };
    const html = renderToStaticMarkup(
      React.createElement(AccessRightsHistoryFiltersBar, {
        search: '',
        onSearchChange: vi.fn(),
        datePreset: '7d',
        onDatePresetChange: vi.fn(),
        actionType: 'all',
        onActionTypeChange: vi.fn(),
        counts,
      })
    );

    expect(html).toContain('Barcha amallar 2');
    expect(html).toContain('Istisno 1');
    expect(html).toContain('Qaytarish 1');
  });

  it('AccessRightsStaffBulkBar renders dark styled reset button instead of white on black', () => {
    const html = renderToStaticMarkup(
      React.createElement(AccessRightsStaffBulkBar, {
        selectedCount: 2,
        isSameRole: true,
        onResetToTemplate: vi.fn(),
        onApplyCopy: vi.fn(),
        onClearSelection: vi.fn(),
      })
    );

    expect(html).toContain('bg-slate-800');
    expect(html).toContain('text-slate-100');
    expect(html).toContain('Shablonga qaytarish');
  });

  it('AccessRightsHeader tab button includes focus:outline-none focus-visible:ring-2 to prevent mouse black outline', () => {
    const html = renderToStaticMarkup(
      React.createElement(AccessRightsHeader, {
        activeTab: 'templates',
        onTabChange: vi.fn(),
        exceptionsCount: 5,
      })
    );

    expect(html).toContain('focus:outline-none');
    expect(html).toContain('focus-visible:ring-2');
  });

  it('filters source modules to only include target role scope when copying template', () => {
    const adminSourceModules = {
      dashboard: true,
      aiAssistant: true,
      products: true,
      restaurantKitchen: true,
      cashierPos: true,
    };

    const cookScope = getScopeForRole('COOK', 'RESTAURANT');
    const filteredForCook = {};
    Object.entries(adminSourceModules).forEach(([modId, val]) => {
      if (cookScope.has(modId)) {
        filteredForCook[modId] = val;
      }
    });

    expect(filteredForCook.aiAssistant).toBeUndefined();
    expect(filteredForCook.products).toBeUndefined();
    expect(filteredForCook.dashboard).toBeUndefined();
    expect(filteredForCook.cashierPos).toBeUndefined();
    expect(filteredForCook.restaurantKitchen).toBe(true);
  });
});
