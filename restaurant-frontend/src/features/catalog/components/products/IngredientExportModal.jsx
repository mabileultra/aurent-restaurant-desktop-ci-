import { useState } from 'react';
import toast from 'react-hot-toast';
import { BaseButton, BaseModal } from '../../../../components/ui';
import { productApi } from '../../../../api';
import { downloadSpreadsheet } from '../../../../utils/downloadSpreadsheet';
import { toastApiError } from '../../../../utils/apiError';

export default function IngredientExportModal({ t, stores = [], onClose }) {
  const [selected, setSelected] = useState([]);
  const [exporting, setExporting] = useState(false);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const runExport = async () => {
    setExporting(true);
    try {
      const res = await productApi.exportList({
        storeIds: selected.length ? selected.join(',') : null,
        markupPercent: 0,
        priceOverrides: [],
      });
      await downloadSpreadsheet(res.data, 'products_export');
      toast.success(t('rst.nomenclature.exportDone'));
      onClose();
    } catch (e) {
      if (e?.message && !e.response) toast.error(e.message);
      else toastApiError(e, t('rst.nomenclature.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <BaseModal
      open
      title={t('rst.nomenclature.exportTitle')}
      onClose={onClose}
      size="md"
      footer={(
        <>
          <BaseButton type="button" variant="secondary" onClick={onClose} disabled={exporting}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton type="button" onClick={runExport} disabled={exporting}>
            {exporting ? t('common.loading') : t('rst.nomenclature.exportSubmit')}
          </BaseButton>
        </>
      )}
    >
      <p className="rst-coming__text">{t('rst.nomenclature.exportInfo')}</p>
      {stores.length > 0 ? (
        <div className="rst-ingredient-export__stores">
          <p className="rst-ingredient-export__label">{t('rst.nomenclature.exportPickStores')}</p>
          <div className="rst-ingredient-export__list">
            {stores.map((s) => (
              <label key={s.id} className="rst-ingredient-export__item">
                <input
                  type="checkbox"
                  checked={selected.includes(s.id)}
                  onChange={() => toggle(s.id)}
                />
                <span>{s.name}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </BaseModal>
  );
}
