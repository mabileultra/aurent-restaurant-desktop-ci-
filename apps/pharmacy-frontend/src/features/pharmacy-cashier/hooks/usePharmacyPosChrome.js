import { useEffect, useState } from 'react';
import { usePharmacyPosActions } from '../../../pharmacy/pos/pharmacyPosActions';

/** Вкладки шапки кассы: модалки на месте, без перехода в админку. */
export function usePharmacyPosChrome({ setReturnOpen }) {
  const actions = usePharmacyPosActions();
  const [checksOpen, setChecksOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [parkedOpen, setParkedOpen] = useState(false);

  useEffect(() => {
    actions?.bind({
      checks: () => setChecksOpen(true),
      cash: () => setCashOpen(true),
      branches: () => setBranchOpen(true),
      reject: () => setReturnOpen(true),
      settings: () => setSettingsOpen(true),
      parked: () => setParkedOpen(true),
    });
    return () => actions?.bind({});
  }, [actions, setReturnOpen]);

  return {
    checksOpen,
    setChecksOpen,
    cashOpen,
    setCashOpen,
    branchOpen,
    setBranchOpen,
    settingsOpen,
    setSettingsOpen,
    parkedOpen,
    setParkedOpen,
  };
}
