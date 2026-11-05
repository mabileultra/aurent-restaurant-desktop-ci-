import { useTranslation } from 'react-i18next';
import PosModalPortal from '../../../components/shared/PosModalPortal';
import CashierDesktopMenuPanel from '../../cashier/components/desktop-menu/CashierDesktopMenuPanel';
import { usePharmacyPosSettingsMenu } from '../hooks/usePharmacyPosSettingsMenu';

/** Настройки кассы — то же меню, что в продукте, в модалке без ухода с POS. */
export default function PharmacyPosSettingsModal({ open, onClose }) {
  const { t } = useTranslation();
  const menu = usePharmacyPosSettingsMenu();

  return (
    <PosModalPortal
      open={open}
      onClose={onClose}
      overlayClassName="pharmacy-pos-settings-overlay"
    >
      <div
        className="pharmacy-pos-settings"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pharmacy-pos-settings-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="pharmacy-pos-settings__head">
          <h2 id="pharmacy-pos-settings-title">
            {t('desktop.menu', { defaultValue: 'Настройки' })}
          </h2>
          <button
            type="button"
            className="pharmacy-pos-settings__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>
        <CashierDesktopMenuPanel menu={menu} embedded />
      </div>
    </PosModalPortal>
  );
}
