export default function CashRegisterHintBanner({ title, body }) {
  return (
    <div className="ui-alert-info flex-col gap-1">
      <p className="font-semibold text-ink">{title}</p>
      <p className="text-ink-muted">{body}</p>
    </div>
  );
}
