import React, { useState } from 'react';
import { PageLayout } from '../../../components/ui';
import PlatformSecurityHeader from '../components/security/PlatformSecurityHeader';
import PlatformSecurityTabsNav from '../components/security/PlatformSecurityTabsNav';
import PlatformSecurityOverviewTab from '../components/security/PlatformSecurityOverviewTab';
import PlatformSecuritySessionsTab from '../components/security/PlatformSecuritySessionsTab';
import PlatformSecurityAuditTab from '../components/security/PlatformSecurityAuditTab';
import PlatformSecurityStaffTab from '../components/security/PlatformSecurityStaffTab';
import PlatformSecurityRulesTab from '../components/security/PlatformSecurityRulesTab';
import PlatformSecurityCloseSessionModal from '../components/security/PlatformSecurityCloseSessionModal';
import PlatformSecuritySudoModal from '../components/security/PlatformSecuritySudoModal';
import PlatformSecurity2faModal from '../components/security/PlatformSecurity2faModal';
import { usePlatformSecurityPage } from '../hooks/usePlatformSecurityPage';
import { SECURITY_TAB_KEYS } from '../utils/securityConstants';
import '../../../styles/platform/security.css';

export default function PlatformSecurityPage() {
  const page = usePlatformSecurityPage();
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);

  return (
    <PageLayout className="platform-security-page space-y-5" spacing="space-y-5">
      <PlatformSecurityHeader
        onOpenCreateStaff={page.staffFlow.openCreate}
        onGoToRules={() => page.setActiveTab(SECURITY_TAB_KEYS.RULES)}
        onOpen2fa={() => setIs2faModalOpen(true)}
      />

      <PlatformSecurityTabsNav
        activeTab={page.activeTab}
        onSelectTab={page.setActiveTab}
        staffCount={page.staffFlow.staffList.length}
      />

      <div className="pt-1">
        {page.activeTab === SECURITY_TAB_KEYS.OVERVIEW && (
          <PlatformSecurityOverviewTab
            flow={page.overviewFlow}
            onGoToAudit={() => page.setActiveTab(SECURITY_TAB_KEYS.AUDIT)}
          />
        )}
        {page.activeTab === SECURITY_TAB_KEYS.SESSIONS && (
          <PlatformSecuritySessionsTab flow={page.sessionsFlow} />
        )}
        {page.activeTab === SECURITY_TAB_KEYS.AUDIT && (
          <PlatformSecurityAuditTab flow={page.auditFlow} />
        )}
        {page.activeTab === SECURITY_TAB_KEYS.STAFF && (
          <PlatformSecurityStaffTab flow={page.staffFlow} />
        )}
        {page.activeTab === SECURITY_TAB_KEYS.RULES && (
          <PlatformSecurityRulesTab
            flow={page.rulesFlow}
            onOpenPersonal2fa={() => setIs2faModalOpen(true)}
          />
        )}
      </div>

      {/* Modallar */}
      <PlatformSecurityCloseSessionModal
        isOpen={Boolean(page.sessionsFlow.pendingCloseSession || page.sessionsFlow.isCloseAllPending)}
        session={page.sessionsFlow.pendingCloseSession}
        isCloseAll={page.sessionsFlow.isCloseAllPending}
        onClose={() => {
          page.sessionsFlow.cancelCloseSession();
          page.sessionsFlow.cancelCloseAllOthers();
        }}
        onConfirm={() => {
          if (page.sessionsFlow.isCloseAllPending) {
            page.sessionsFlow.confirmCloseAllOthers();
          } else {
            page.sessionsFlow.confirmCloseSession();
          }
        }}
      />

      <PlatformSecuritySudoModal
        isOpen={page.rulesFlow.isSudoModalOpen}
        onClose={() => page.rulesFlow.setIsSudoModalOpen(false)}
        onConfirm={page.rulesFlow.confirmSudoAndSave}
        isSubmitting={page.rulesFlow.isSavingRules}
      />

      <PlatformSecurity2faModal
        isOpen={is2faModalOpen}
        onClose={() => setIs2faModalOpen(false)}
      />
    </PageLayout>
  );
}
