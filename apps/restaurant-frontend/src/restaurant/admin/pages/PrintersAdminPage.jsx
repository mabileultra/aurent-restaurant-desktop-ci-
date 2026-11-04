import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { rstKitchenApi } from '../../api/kitchen.api';
import { rstMenuApi } from '../../api/menu.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import AdminWorkspaceGate from '../components/AdminWorkspaceGate';
import PrintersAdminNav from '../components/PrintersAdminNav';
import ReceiptCompanyProfilePanel from '../components/ReceiptCompanyProfilePanel';
import RestaurantPrinterSettings from '../components/RestaurantPrinterSettings';
import RestaurantPrintProfilePanel from '../components/RestaurantPrintProfilePanel';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/print-profile.css';
import '../styles/printers-admin-shell.css';

const TAB_COPY = {
  devices: {
    titleKey: 'rst.admin.printersTitle',
    titleDefault: 'Принтеры этого компьютера',
    hintKey: 'rst.admin.printersHint',
    hintDefault: 'Настройки хранятся на этом ПК. Назначьте чек оплаты, счёт гостю и станции.',
  },
  companyReceipt: {
    titleKey: 'rst.admin.printersTabCompanyReceipt',
    titleDefault: 'Чек компании',
    hintKey: 'rst.admin.receiptCompanyHint',
    hintDefault: 'Общие блоки фискального чека для всей компании: вкл/выкл и размер текста.',
  },
  slipDesign: {
    titleKey: 'rst.admin.printersTabSlipDesign',
    titleDefault: 'Слипы и смена',
    hintKey: 'rst.admin.printProfileHint',
    hintDefault: 'Кухня, гостевой счёт, отказ и смена — каждый блок можно выключить и задать размер.',
  },
};

export default function PrintersAdminPage() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();
  const [tab, setTab] = useState('devices');

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
  const isLoading = stationsQuery.isLoading || categoriesQuery.isLoading || boardQuery.isLoading;
  const isError = stationsQuery.isError || categoriesQuery.isError || boardQuery.isError;
  const copy = TAB_COPY[tab] || TAB_COPY.devices;

  return (
    <AdminWorkspaceGate
      t={t}
      workspace={workspace}
      isLoading={isLoading && !stations.length}
      isError={isError}
      onRetry={() => {
        stationsQuery.refetch();
        categoriesQuery.refetch();
        boardQuery.refetch();
      }}
    >
      <section className="rst-stations">
        <div className="rst-halls__toolbar">
          <div>
            <h1 className="rst-coming__title">{t(copy.titleKey, { defaultValue: copy.titleDefault })}</h1>
            <p className="rst-coming__text mb-0">{t(copy.hintKey, { defaultValue: copy.hintDefault })}</p>
          </div>
        </div>

        <div className="rst-printers-shell">
          <PrintersAdminNav active={tab} onChange={setTab} t={t} />
          <div className="rst-printers-shell__main">
            {tab === 'devices' ? (
              <RestaurantPrinterSettings
                stations={stations}
                categories={autoPrintCategories}
                storeId={workspace.storeId}
                kitchenBoardEnabled={kitchenBoardEnabled}
                t={t}
              />
            ) : null}
            {tab === 'companyReceipt' ? <ReceiptCompanyProfilePanel /> : null}
            {tab === 'slipDesign' ? (
              <RestaurantPrintProfilePanel
                storeId={workspace.storeId}
                t={t}
                initialSlip="GUEST_BILL"
              />
            ) : null}
          </div>
        </div>
      </section>
    </AdminWorkspaceGate>
  );
}
