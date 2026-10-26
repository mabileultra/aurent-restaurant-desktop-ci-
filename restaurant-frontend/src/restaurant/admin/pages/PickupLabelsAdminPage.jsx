import { useTranslation } from 'react-i18next';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import PickupLabelSettings from '../components/PickupLabelSettings';
import RestaurantPrintProfilePanel from '../components/RestaurantPrintProfilePanel';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/print-profile.css';

export default function PickupLabelsAdminPage() {
  const { t } = useTranslation();
  const { hasModule } = useModuleAccess();
  const workspace = useRestaurantWorkspaceStore();

  if (!hasModule('restaurantPickupLabel')) {
    return <div className="rst-notice">{t('rst.admin.pickupLabelsDenied')}</div>;
  }
  if (workspace.noAssignment) {
    return <div className="rst-notice">{t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-stations">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{t('rst.nav.pickupLabels')}</h1>
          <p className="rst-coming__text mb-0">{t('rst.admin.pickupLabelsHint')}</p>
        </div>
      </div>
      {workspace.isLoading && workspace.storeId == null ? null : !workspace.storeId ? (
        <div className="rst-notice">{t('rst.admin.selectStore')}</div>
      ) : (
        <>
          <PickupLabelSettings t={t} />
          <RestaurantPrintProfilePanel storeId={workspace.storeId} onlySlip="PICKUP_LABEL" t={t} />
        </>
      )}
    </section>
  );
}
