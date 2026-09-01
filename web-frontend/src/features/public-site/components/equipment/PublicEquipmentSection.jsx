import { useTranslation } from 'react-i18next';
import PublicEquipmentGrid from './PublicEquipmentGrid';
import PublicLeadForm from '../PublicLeadForm';

export default function PublicEquipmentSection() {
  const { t } = useTranslation();

  return (
    <section className="public-section" id="equipment">
      <div className="public-site-section">
        <PublicEquipmentGrid />
        <div className="public-panel public-equipment-section__form">
          <h3 className="public-panel__title">{t('publicSite.equipment.formTitle')}</h3>
          <PublicLeadForm leadType="EQUIPMENT" source="equipment" compact />
        </div>
      </div>
    </section>
  );
}
