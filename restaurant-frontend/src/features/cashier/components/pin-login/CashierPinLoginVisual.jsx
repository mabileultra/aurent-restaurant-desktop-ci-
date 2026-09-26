import { PIN_LOGIN_HERO_FALLBACK_URL, PIN_LOGIN_HERO_URL } from '../../utils/cashierPinUtils';

export default function CashierPinLoginVisual() {
  return (
    <aside className="cashier-pin-login__visual" aria-hidden="true">
      <picture>
        <source srcSet={PIN_LOGIN_HERO_URL} type="image/webp" />
        <img
          className="cashier-pin-login__visual-img"
          src={PIN_LOGIN_HERO_FALLBACK_URL}
          alt=""
          decoding="async"
        />
      </picture>
      <div className="cashier-pin-login__visual-overlay" />
    </aside>
  );
}
