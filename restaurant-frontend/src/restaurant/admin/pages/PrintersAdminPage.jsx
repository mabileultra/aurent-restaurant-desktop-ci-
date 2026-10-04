import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { rstKitchenApi } from '../../api/kitchen.api';
import { rstMenuApi } from '../../api/menu.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import RestaurantPrinterSettings from '../components/RestaurantPrinterSettings';
import RestaurantPrintProfilePanel from '../components/RestaurantPrintProfilePanel';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/print-profile.css';

export default function PrintersAdminPage() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();
  const stationsQuery = useQuery({
    queryKey: ['rst-stations-admin', workspace.storeId],
    queryFn: () => rstKitchenApi.listStations(workspace.storeId, false).then((r) => r.data),
    enabled: workspace.storeId != null,
  });
  const stations = (stationsQuery.data ?? []).filter((station) => station.active);
  const categoriesQuery = useQuery({
    queryKey: ['rst-menu-categories-admin', workspace.storeId],
    queryFn: () => rstMenuApi.listCategories(workspace.storeId, true).then((r) => r.data),
    enabled: workspace.storeId != null,
  });
  const autoPrintCategories = (categoriesQuery.data ?? [])
    .filter((row) => row.autoPrint)
    .slice()
    .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
  const boardQuery = useQuery({
    queryKey: ['rst-kitchen-board', workspace.storeId],
    queryFn: () => rstKitchenApi.getKitchenBoard(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null,
  });
  const kitchenBoardEnabled = boardQuery.data?.enabled !== false;

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
      {workspace.isLoading && workspace.storeId == null ? null : !workspace.storeId ? (
        <div className="rst-notice">{t('rst.admin.selectStore')}</div>
      ) : (
        <>
          <RestaurantPrinterSettings
            stations={stations}
            categories={autoPrintCategories}
            storeId={workspace.storeId}
            kitchenBoardEnabled={kitchenBoardEnabled}
            t={t}
          />
          <RestaurantPrintProfilePanel
            storeId={workspace.storeId}
            t={t}
          />
        </>
      )}
    </section>
  );
}
