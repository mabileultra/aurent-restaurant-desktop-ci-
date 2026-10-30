export default function FiscalReceiptHeaderBlock({
  showLogo,
  logoSrc,
  logoMaxHeightMm,
  showName,
  companyName,
  showAddress,
  companyAddress,
  showPhone,
  companyPhone,
  showStir,
  stir,
  phoneLabel,
  stirLabel,
  fs,
}) {
  return (
    <header className="receipt-section border-b border-dashed border-black pb-3">
      {showLogo && logoSrc ? (
        <div {...fs('logo')}>
          <img
            src={logoSrc}
            alt=""
            className="receipt-logo mx-auto mb-2"
            style={logoMaxHeightMm ? { maxHeight: `${logoMaxHeightMm}mm` } : undefined}
          />
        </div>
      ) : null}
      {showName ? (
        <p {...fs('companyName', 'receipt-title break-words')}>{companyName}</p>
      ) : null}
      {showAddress && companyAddress ? (
        <p {...fs('companyAddress', 'receipt-subtitle mt-1 whitespace-pre-line break-words')}>
          {companyAddress}
        </p>
      ) : null}
      {showPhone && companyPhone ? (
        <p {...fs('companyPhone', 'receipt-subtitle mt-1 break-words')}>
          {phoneLabel}: {companyPhone}
        </p>
      ) : null}
      {showStir && stir ? (
        <p {...fs('stir', 'receipt-subtitle mt-1')}>
          {stirLabel}: {stir}
        </p>
      ) : null}
    </header>
  );
}
