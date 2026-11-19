import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../../styles/shared/tasnif-search.css';

export default function TasnifPackagePickerModal({ open, item, lang, onSelect, onClose }) {
  const { t } = useTranslation();
  if (!open || !item) return null;

  const packages = item.packages ?? [];

  const unitLabel = (pkg) => {
    if (lang?.startsWith('ru')) {
      return pkg.nameRu || pkg.nameUz || pkg.nameLat || '—';
    }
    return pkg.nameUz || pkg.nameRu || pkg.nameLat || '—';
  };

  return (
    <div className="ui-modal-overlay z-[120]">
      <div
        className="ui-modal-panel max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tasnif-package-title"
      >
        <div className="ui-modal-header">
          <h3 id="tasnif-package-title" className="text-base font-semibold text-ink">
            {t('productCatalog.selectPackage')}
          </h3>
          <button type="button" onClick={onClose} className="ui-icon-btn" aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>
        <p className="px-5 pt-3 text-xs text-ink-muted line-clamp-2">{item.name}</p>
        <div className="ui-modal-body">
          {packages.length === 0 ? (
            <p className="text-sm text-ink-muted">{t('productCatalog.noPackages')}</p>
          ) : (
            <div className="tasnif-package-modal__list">
              {packages.map((pkg) => (
                <button
                  key={pkg.code}
                  type="button"
                  className="tasnif-package-modal__option"
                  onClick={() => onSelect(pkg)}
                >
                  <div className="tasnif-package-modal__code">{pkg.code}</div>
                  <div className="tasnif-package-modal__unit">{unitLabel(pkg)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
