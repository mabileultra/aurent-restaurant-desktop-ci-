import { describe, it, expect } from 'vitest';
import { buildReceiptQrImageDataUrl, receiptQrPixelSize } from './buildReceiptQrImage';

describe('buildReceiptQrImage', () => {
  it('is a bit smaller than a typical OFD QR on 80mm paper', () => {
    expect(receiptQrPixelSize(80)).toBe(224);
    expect(receiptQrPixelSize(58)).toBe(176);
  });

  it('renders ofd URL as a PNG data URL', async () => {
    const url =
      'https://ofd.soliq.uz/check?t=VG544170030015&r=4&c=20260916152500&s=438580950279';
    const dataUrl = await buildReceiptQrImageDataUrl(url, 80);
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(800);
  });
});
