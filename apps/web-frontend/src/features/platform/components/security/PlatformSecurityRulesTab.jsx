import React from 'react';
import PlatformSecurityTwoFactorRulesCard from './PlatformSecurityTwoFactorRulesCard';
import PlatformSecurityPasswordRulesCard from './PlatformSecurityPasswordRulesCard';
import PlatformSecuritySessionIpRulesCard from './PlatformSecuritySessionIpRulesCard';
import PlatformSecurityCashierPasswordCard from './PlatformSecurityCashierPasswordCard';
import PlatformSecurityRulesStickyBar from './PlatformSecurityRulesStickyBar';

export default function PlatformSecurityRulesTab({ flow }) {
  const {
    rules,
    dirtyCount,
    toggleTfaRole,
    setTfaMethod,
    setMinLen,
    setExpiry,
    toggleReq,
    setConc,
    toggleNotify,
    toggleIpOn,
    newIpAddr,
    setNewIpAddr,
    addIp,
    removeIp,
    resetRules,
    requestSaveRules,
  } = flow;

  return (
    <div className="space-y-6">
      {/* 1. Ikki bosqichli tasdiqlash (2FA) */}
      <PlatformSecurityTwoFactorRulesCard
        rules={rules}
        toggleTfaRole={toggleTfaRole}
        setTfaMethod={setTfaMethod}
      />

      {/* 2. Parol talablari */}
      <PlatformSecurityPasswordRulesCard
        rules={rules}
        setMinLen={setMinLen}
        setExpiry={setExpiry}
        toggleReq={toggleReq}
      />

      {/* 3. Seanslar va IP allowlist */}
      <PlatformSecuritySessionIpRulesCard
        rules={rules}
        setConc={setConc}
        toggleNotify={toggleNotify}
        toggleIpOn={toggleIpOn}
        newIpAddr={newIpAddr}
        setNewIpAddr={setNewIpAddr}
        addIp={addIp}
        removeIp={removeIp}
      />

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
