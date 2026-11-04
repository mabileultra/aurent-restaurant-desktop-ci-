import { useTranslation } from 'react-i18next';
import '../styles/rst-stock-hub.css';

/** Page chrome for stock sections — nav lives in the admin sidebar under «Склад». */
export default function RstStockHubChrome({ children, titleKey = 'stockTitle', subtitleKey = 'stockHubHint' }) {
  const { t } = useTranslation();

  return (
    <div className="rst-stock-hub">
      <div className="rst-stock-hub__head">
        <div>
          <h1 className="rst-coming__title">{t(`rst.admin.${titleKey}`)}</h1>
          <p className="rst-coming__text mb-0">{t(`rst.admin.${subtitleKey}`)}</p>
        </div>
      </div>
      <div className="rst-stock-hub__body">
        {children}
      </div>
    </div>
  );
}
