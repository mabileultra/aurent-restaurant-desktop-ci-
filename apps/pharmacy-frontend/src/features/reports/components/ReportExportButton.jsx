import { useState } from 'react';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { downloadSpreadsheet } from '../../../utils/downloadSpreadsheet';

export default function ReportExportButton({ fetchBlob, filenamePrefix, disabled = false }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      const res = await fetchBlob();
      downloadSpreadsheet(res.data, filenamePrefix);
      toast.success(t('stockReports.exportDone'));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('stockReports.exportFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || busy}
      className="ui-btn ui-btn-secondary"
    >
      <Download size={16} strokeWidth={1.75} />
      {busy ? t('stockReports.exporting') : t('stockReports.export')}
    </button>
  );
}
