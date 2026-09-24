import BrandMark from '../../../../components/shared/BrandMark';
import { isDesktopCashier } from '../../../../utils/authLogin';
import { BRAND_LOGO_SIZES } from '../../../../config/brandLogos';

export default function CashierPinLoginHeader({ appName, subtitle }) {
  const desktop = isDesktopCashier();

  return (
    <header className="cashier-pin-login__header">
      <div className="cashier-pin-login__logo cashier-pin-login__logo--default">
        <BrandMark
          variant="full"
          height={BRAND_LOGO_SIZES.fullLg}
        />
      </div>
      {!desktop ? <h1 className="cashier-pin-login__title">{appName}</h1> : null}
      <p className="cashier-pin-login__subtitle">{subtitle}</p>
    </header>
  );
}
