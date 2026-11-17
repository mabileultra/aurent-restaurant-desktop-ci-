import React from 'react';
import { FileText, MessageCircle, ShieldCheck } from 'lucide-react';

export default function TenantBillingFooter({ t }) {
  return (
    <section className="billing-footer">
      <div className="billing-footer__card billing-footer__card--grace">
        <span className="billing-footer__icon"><ShieldCheck size={18} /></span>
        <div>
          <p className="billing-footer__title">{t('billing.footerGraceTitle')}</p>
          <p className="billing-footer__text">{t('billing.footerGraceText')}</p>
        </div>
      </div>
      <div className="billing-footer__card billing-footer__card--docs">
        <span className="billing-footer__icon"><FileText size={18} /></span>
        <div>
          <p className="billing-footer__title">{t('billing.footerDocsTitle')}</p>
          <p className="billing-footer__text">{t('billing.footerDocsText')}</p>
        </div>
      </div>
      <div className="billing-footer__card billing-footer__card--support">
        <span className="billing-footer__icon"><MessageCircle size={18} /></span>
        <div>
          <p className="billing-footer__title">{t('billing.footerSupportTitle')}</p>
          <p className="billing-footer__text">{t('billing.footerSupportText')}</p>
        </div>
      </div>
    </section>
  );
}
