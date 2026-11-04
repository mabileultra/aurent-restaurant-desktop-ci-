import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { openPharmacyExternalUrl } from '../utils/pharmacyIntegrationLinks';

export function usePharmacyIntegrationToolbar({
  capabilities,
  externalUrls,
  onFocusSearch,
  setMoreOpen,
}) {
  const { t } = useTranslation();

  const handleLink = useCallback((link) => {
    if (link.kind === 'dmed') {
      if (!capabilities.dmedEnabled) {
        toast(t('pharmacyCashier.integrations.dmedDisabled'));
        return;
      }
      openPharmacyExternalUrl(externalUrls.dmed);
      return;
    }
    if (link.kind === 'analogs') {
      onFocusSearch?.();
      toast(t('pharmacyCashier.integrations.analogsHint'), { icon: '🔍' });
      setMoreOpen?.(false);
      return;
    }
    if (link.kind === 'external' && link.urlKey) {
      openPharmacyExternalUrl(externalUrls[link.urlKey]);
      setMoreOpen?.(false);
    }
  }, [capabilities.dmedEnabled, externalUrls, onFocusSearch, setMoreOpen, t]);

  const isLinkVisible = useCallback((link) => {
    if (link.requiresDmed && !capabilities.dmedEnabled) {
      return false;
    }
    return true;
  }, [capabilities.dmedEnabled]);

  return {
    handleLink,
    isLinkVisible,
  };
}
