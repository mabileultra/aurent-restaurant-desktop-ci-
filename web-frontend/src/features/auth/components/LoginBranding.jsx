import BrandMark from '../../../components/shared/BrandMark';

export default function LoginBranding({ title, subtitle }) {
  return (
    <div className="login-card__brand">
      <span className="login-card__mark">
        <BrandMark size={28} iconClassName="text-white" />
      </span>
      <h1 className="login-card__title">{title}</h1>
      {subtitle ? <p className="login-card__subtitle">{subtitle}</p> : null}
    </div>
  );
}
