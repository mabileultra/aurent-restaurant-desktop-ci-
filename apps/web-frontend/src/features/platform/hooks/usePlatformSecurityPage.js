import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SECURITY_TAB_KEYS } from '../utils/securityConstants';
import { useSecurityOverviewFlow } from './useSecurityOverviewFlow';
import { useSecuritySessionsFlow } from './useSecuritySessionsFlow';
import { useSecurityAuditFlow } from './useSecurityAuditFlow';
import { useSecurityStaffFlow } from './useSecurityStaffFlow';
import { useSecurityRulesFlow } from './useSecurityRulesFlow';

/**
 * Xavfsizlik sahifasining asosiy orkestratsiya hooki.
 */
export function usePlatformSecurityPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const validTabs = Object.values(SECURITY_TAB_KEYS);
  const initialTab = validTabs.includes(tabParam) ? tabParam : SECURITY_TAB_KEYS.OVERVIEW;

  const [activeTab, setActiveTabState] = useState(initialTab);

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTabState(tabParam);
    }
  }, [tabParam, activeTab]);

  const setActiveTab = (tabKey) => {
    setActiveTabState(tabKey);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tabKey === SECURITY_TAB_KEYS.OVERVIEW) {
        next.delete('tab');
      } else {
        next.set('tab', tabKey);
      }
      return next;
    });
  };

  const overviewFlow = useSecurityOverviewFlow({ onSelectTab: setActiveTab });
  const sessionsFlow = useSecuritySessionsFlow();
  const auditFlow = useSecurityAuditFlow();
  const staffFlow = useSecurityStaffFlow();
  const rulesFlow = useSecurityRulesFlow();

  return {
    t,
    activeTab,
    setActiveTab,
    overviewFlow,
    sessionsFlow,
    auditFlow,
    staffFlow,
    rulesFlow,
    // Backwards-compatibility properties
    password: rulesFlow.cashierPw1,
    setPassword: rulesFlow.setCashierPw1,
    passwordConfirm: rulesFlow.cashierPw2,
    setPasswordConfirm: rulesFlow.setCashierPw2,
    passwordStatus: rulesFlow.cashierStatus,
    passwordLoading: rulesFlow.isCashierLoading,
    handlePasswordSave: rulesFlow.handleCashierPwSave,
    superAdmins: staffFlow.staffList,
    adminsLoading: staffFlow.isLoading,
    adminForm: staffFlow.form,
    openCreateAdmin: staffFlow.openCreate,
    openEditAdmin: staffFlow.openEdit,
    closeAdminForm: staffFlow.closeForm,
    updateAdminField: staffFlow.updateField,
    handleAdminSubmit: staffFlow.handleSubmit,
    adminSaving: staffFlow.isSaving,
    passwordMutation: { isPending: rulesFlow.isCashierSaving },
  };
}
