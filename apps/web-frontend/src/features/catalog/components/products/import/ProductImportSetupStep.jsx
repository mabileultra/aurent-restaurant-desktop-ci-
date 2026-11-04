import toast from 'react-hot-toast';
import { productApi } from '../../../../../api';
import { optCls } from '../../../../../utils/productImportUtils';

export default function ProductImportSetupStep({ t, source, setSource, mode, setMode }) {
  const downloadTemplate = async (e) => {
    e.preventDefault();
    try {
      const res = await productApi.importTemplate();
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products_import_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('products.import.templateSoon'));
    }
  };

  return (
    <div className="product-import-setup">
      <div className="product-import-setup__head">
        <div>
          <p className="product-import-setup__kicker">{t('products.import.setupKicker')}</p>
          <p className="product-import-setup__lead">{t('products.import.setupLead')}</p>
        </div>
        <button type="button" className="product-import-setup__link" onClick={downloadTemplate}>
          {t('products.import.downloadTemplate')}
        </button>
      </div>

      <section className="product-import-panel">
        <h3 className="product-import-panel__label">{t('products.import.sourceLabel')}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {['UZ_INVOICE', 'CATALOG'].map((key) => (
            <label key={key} className={optCls(source === key)}>
              <input
                type="radio"
                name="src"
                checked={source === key}
                onChange={() => setSource(key)}
                className="mt-1"
              />
              <span className="text-sm text-slate-800 dark:text-slate-200">
                {t(`products.import.source.${key}`)}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="product-import-panel">
        <h3 className="product-import-panel__label">{t('products.import.question')}</h3>
        <div className="space-y-2">
          {['TO_CATALOG', 'AS_RECEIPT'].map((key) => (
            <label key={key} className={optCls(mode === key)}>
              <input type="radio" name="im" checked={mode === key} onChange={() => setMode(key)} className="mt-1" />
              <span className="text-sm text-slate-800 dark:text-slate-200">
                {t(`products.import.mode.${key}`)}
              </span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
