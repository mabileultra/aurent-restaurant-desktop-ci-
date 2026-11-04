export default function InstallerDownloadButton({ href, label, sublabel, icon: Icon, disabled }) {
  const content = (
    <>
      <span className="installer-download-card__icon">
        <Icon size={20} aria-hidden />
      </span>
      <span>
        <span className="installer-download-card__label">{label}</span>
        {sublabel ? <span className="installer-download-card__sub">{sublabel}</span> : null}
      </span>
    </>
  );

  if (disabled || !href) {
    return <span className="installer-download-card is-disabled">{content}</span>;
  }

  return (
    <a href={href} download className="installer-download-card">
      {content}
    </a>
  );
}
