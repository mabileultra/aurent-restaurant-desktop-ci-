import { useState } from 'react';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { BaseButton } from '../../../components/ui';
import { downloadSpreadsheet } from '../../../utils/downloadSpreadsheet';
import { toastApiError } from '../../../utils/apiError';

export default function ReportExportButton({ fetchBlob, filenamePrefix, disabled = false }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      const res = await fetchBlob();
      await downloadSpreadsheet(res.data, filenamePrefix);
      toast.success(t('stockReports.exportDone'));
    } catch (e) {
      if (e?.message && !e.response) toast.error(e.message);
      else toastApiError(e, t('stockReports.exportFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <BaseButton type="button" variant="ghost" onClick={handleExport} disabled={disabled || busy}>
      <Download size={16} aria-hidden />
      {busy ? t('stockReports.exporting') : t('stockReports.export')}
    </BaseButton>
  );
}
