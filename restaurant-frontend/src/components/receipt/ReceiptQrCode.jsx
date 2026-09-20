import { useMemo } from 'react';
import QRCode from 'qrcode';

/**
 * QR на чеке — ссылка ГНК (ofd.soliq.uz). SVG синхронно, чтобы печать не ждала img.
 */
export default function ReceiptQrCode({ value, sizePx = 120 }) {
  const model = useMemo(() => {
    const text = String(value || '').trim();
    if (!text) return null;
    try {
      return QRCode.create(text, { errorCorrectionLevel: 'M' });
    } catch {
      return null;
    }
  }, [value]);

  if (!model?.modules) return null;

  const size = model.modules.size;
  const cells = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (model.modules.get(x, y)) {
        cells.push(`M${x} ${y}h1v1h-1z`);
      }
    }
  }

  return (
    <svg
      className="receipt-qr mx-auto block max-w-full"
      width={sizePx}
      height={sizePx}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      aria-hidden
      style={{ width: sizePx, height: sizePx, maxWidth: '100%' }}
    >
      <rect width={size} height={size} fill="#ffffff" />
      <path d={cells.join('')} fill="#000000" />
    </svg>
  );
}
