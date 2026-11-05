export default function AdminDocumentButton({
  variant = 'ghost',
  type = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`admin-doc-btn admin-doc-btn--${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
