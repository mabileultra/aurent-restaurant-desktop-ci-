export default function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="base-error" role="alert">{message}</div>;
}
