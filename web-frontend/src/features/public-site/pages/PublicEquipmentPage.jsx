import { useTranslation } from 'react-i18next';
import PublicSitePageShell from '../components/PublicSitePageShell';
import PublicEquipmentGrid from '../components/equipment/PublicEquipmentGrid';
import PublicLeadForm from '../components/PublicLeadForm';

export default function PublicEquipmentPage() {
  const { t } = useTranslation();

  return (
    <PublicSitePageShell>
      <div className="public-page-content">
        <PublicEquipmentGrid />
        <div className="public-panel">
          <h2 className="public-panel__title">{t('publicSite.equipment.formTitle')}</h2>
          <PublicLeadForm leadType="EQUIPMENT" source="equipment" compact />
        </div>
      </div>
    </PublicSitePageShell>
  );
}
