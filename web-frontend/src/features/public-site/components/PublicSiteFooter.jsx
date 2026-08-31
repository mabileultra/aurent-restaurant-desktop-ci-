import { Link } from 'react-router-dom';
import { FileText, Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BrandMark from '../../../components/shared/BrandMark';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';

export default function PublicSiteFooter() {
  const { t } = useTranslation();
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);
  const year = new Date().getFullYear();

  return (
    <footer className="public-site-footer">
      <div className="public-site-footer__inner">
        <Link to="/login" className="public-site-footer__brand">
          <span className="public-site-footer__mark">
            <BrandMark variant="full" height={16} />
          </span>
          {displayAppName() || 'Aurent'}
        </Link>
        <p className="public-site-footer__copy">
          {t('publicSite.footerCopy', { year })}
        </p>
        <div className="public-site-footer__icons" aria-hidden>
          <Headphones size={16} strokeWidth={2} />
          <FileText size={16} strokeWidth={2} />
        </div>
      </div>
    </footer>
  );
}
