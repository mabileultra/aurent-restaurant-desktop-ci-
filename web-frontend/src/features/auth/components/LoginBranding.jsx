import BrandMark from '../../../components/shared/BrandMark';
import { BRAND_LOGO_SIZES } from '../../../config/brandLogos';

export default function LoginBranding({ title, subtitle }) {
  return (
    <div className="login-card__brand">
      <span className="login-card__mark login-card__mark--default">
        <BrandMark variant="full" height={BRAND_LOGO_SIZES.fullLg} />
      </span>
      <h1 className="login-card__title">{title}</h1>
      {subtitle ? <p className="login-card__subtitle">{subtitle}</p> : null}
    </div>
  );
}
