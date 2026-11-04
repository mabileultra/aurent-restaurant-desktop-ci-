/** EAN-13 check digit — pharmacy barcodes (no scales/PLU dependency). */
export function ean13CheckDigit(twelveDigits) {
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    const d = Number(twelveDigits[i]);
    sum += i % 2 === 0 ? d : d * 3;
  }
  return String((10 - (sum % 10)) % 10);
}
