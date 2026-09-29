import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { rstKitchenApi } from '../../api/kitchen.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import RestaurantPrinterSettings from '../components/RestaurantPrinterSettings';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';

export default function PrintersAdminPage() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();
  const stationsQuery = useQuery({
    queryKey: ['rst-stations-admin', workspace.storeId],
    queryFn: () => rstKitchenApi.listStations(workspace.storeId, false).then((r) => r.data),
    enabled: workspace.storeId != null,
  });
  const stations = (stationsQuery.data ?? []).filter((station) => station.active);

  if (workspace.noAssignment) {
    return <div className="rst-notice">{t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-stations">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{t('rst.admin.printersTitle')}</h1>
          <p className="rst-coming__text mb-0">{t('rst.admin.printersHint')}</p>
        </div>
      </div>
      {!workspace.storeId ? (
        <div className="rst-notice">{t('rst.admin.selectStore')}</div>
      ) : (
        <RestaurantPrinterSettings stations={stations} t={t} />
      )}
    </section>
  );
}
