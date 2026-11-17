export default function CashRegisterErrorBanner({ message }) {
  return (
    <div className="ui-alert-danger" role="alert">
      {message}
    </div>
  );
}
