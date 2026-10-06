import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { platformAnalyticsApi } from '../../../api';
import { downloadSpreadsheet } from '../../../utils/downloadSpreadsheet';

export function usePlatformAnalyticsExport(view, period) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const exportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await platformAnalyticsApi.export({ view, period });
      downloadSpreadsheet(res.data, `platform_analytics_${view}`);
      toast.success(t('platform.analytics.exportDone'));
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('platform.analytics.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  return { exporting, exportExcel };
}
