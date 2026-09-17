import { describe, it, expect } from 'vitest';
import { buildReceiptQrImageDataUrl, receiptQrPixelSize } from './buildReceiptQrImage';

describe('buildReceiptQrImage', () => {
  it('prints a large OFD QR that still fits the tape', () => {
    expect(receiptQrPixelSize(80)).toBe(336);
    expect(receiptQrPixelSize(58)).toBe(256);
  });

  it('renders ofd URL as a PNG data URL', async () => {
    const url =
      'https://ofd.soliq.uz/check?t=VG544170030015&r=4&c=20260916152500&s=438580950279';
    const dataUrl = await buildReceiptQrImageDataUrl(url, 80);
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(800);
  });
});
