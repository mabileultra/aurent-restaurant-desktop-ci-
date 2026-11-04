export default function CashRegisterHintBanner({ title, body }) {
  return (
    <div className="admin-soft-panel px-4 py-3 text-sm">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-emerald-900/90 dark:text-emerald-100/90">{body}</p>
    </div>
  );
}
