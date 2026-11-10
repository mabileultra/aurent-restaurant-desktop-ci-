import React from 'react';
import PlatformSecurityTwoFactorRulesCard from './PlatformSecurityTwoFactorRulesCard';
import PlatformSecurityPasswordRulesCard from './PlatformSecurityPasswordRulesCard';
import PlatformSecuritySessionIpRulesCard from './PlatformSecuritySessionIpRulesCard';
import PlatformSecurityCashierPasswordCard from './PlatformSecurityCashierPasswordCard';
import PlatformSecurityRulesStickyBar from './PlatformSecurityRulesStickyBar';

export default function PlatformSecurityRulesTab({ flow, onOpenPersonal2fa }) {
  const {
    rules,
    dirtyCount,
    resetRules,
    requestSaveRules,
  } = flow;

  return (
    <div className="space-y-6">
      {/* 1. Ikki bosqichli tasdiqlash (2FA) */}
      <PlatformSecurityTwoFactorRulesCard
        rules={rules}
        flow={flow}
        onOpenPersonal2fa={onOpenPersonal2fa}
      />

      {/* 2. Parol talablari */}
      <PlatformSecurityPasswordRulesCard rules={rules} flow={flow} />

      {/* 3. Seanslar va IP allowlist */}
      <PlatformSecuritySessionIpRulesCard rules={rules} flow={flow} />

      {/* 4. Kassa server sozlamalari paroli kartasi */}
      <PlatformSecurityCashierPasswordCard flow={flow} />

      {/* 5. Sticky Bottom Bar */}
      <PlatformSecurityRulesStickyBar
        dirtyCount={dirtyCount}
        onReset={resetRules}
        onSave={requestSaveRules}
      />
    </div>
  );
}
