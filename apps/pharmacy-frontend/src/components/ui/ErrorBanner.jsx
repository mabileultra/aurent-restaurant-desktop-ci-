export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="ui-alert-danger">
      {message}
    </div>
  );
}
