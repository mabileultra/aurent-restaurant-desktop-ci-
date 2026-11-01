/**
 * Har bir rol uchun modul guruhlari statistikasi (PDF 1-sahifaga aniq muvofiq)
 */
export const RESTAURANT_BREAKDOWNS = {
  ADMIN: [
    { name: 'Asosiy', enabled: 2, total: 3 },
    { name: 'Tovarlar', enabled: 1, total: 1 },
    { name: 'Ombor', enabled: 5, total: 5 },
    { name: 'Buyurtmalar', enabled: 1, total: 1 },
    { name: 'Moliya', enabled: 10, total: 10 },
    { name: 'Kassalar', enabled: 4, total: 4 },
    { name: 'Hisobot — s...', enabled: 10, total: 10 },
    { name: 'Hisobot — o...', enabled: 12, total: 12 },
    { name: 'Restoran', enabled: 8, total: 8 },
    { name: 'Sozlamalar', enabled: 5, total: 5 },
  ],
  MANAGER: [
    { name: 'Asosiy', enabled: 2, total: 3 },
    { name: 'Tovarlar', enabled: 1, total: 1 },
    { name: 'Ombor', enabled: 5, total: 5 },
    { name: 'Buyurtmalar', enabled: 1, total: 1 },
    { name: 'Moliya', enabled: 8, total: 10 },
    { name: 'Kassalar', enabled: 4, total: 4 },
    { name: 'Hisobot — sot...', enabled: 8, total: 10 },
    { name: 'Hisobot — o...', enabled: 12, total: 12 },
    { name: 'Restoran', enabled: 8, total: 8 },
    { name: 'Sozlamalar', enabled: 5, total: 5 },
  ],
  CASHIER: [
    { name: 'Kassa oynasi', enabled: 3, total: 3 },
  ],
  WAITER: [
    { name: 'Kassa oynasi', enabled: 3, total: 3 },
    { name: 'Restoran', enabled: 3, total: 4 },
  ],
  COOK: [
    { name: 'Restoran', enabled: 2, total: 2 },
  ],
};

const DEFAULT_RETAIL_BREAKDOWN = {
  ADMIN: [
    { name: 'Asosiy', enabled: 3, total: 3 },
    { name: 'Tovarlar', enabled: 1, total: 1 },
    { name: 'Ombor', enabled: 5, total: 5 },
    { name: 'Buyurtmalar', enabled: 1, total: 1 },
    { name: 'Moliya', enabled: 10, total: 10 },
    { name: 'Kassalar', enabled: 4, total: 4 },
    { name: 'Hisobotlar', enabled: 22, total: 22 },
    { name: 'Sozlamalar', enabled: 4, total: 4 },
  ],
  MANAGER: [
    { name: 'Asosiy', enabled: 2, total: 3 },
    { name: 'Tovarlar', enabled: 1, total: 1 },
    { name: 'Ombor', enabled: 5, total: 5 },
    { name: 'Buyurtmalar', enabled: 1, total: 1 },
    { name: 'Moliya', enabled: 8, total: 10 },
    { name: 'Kassalar', enabled: 4, total: 4 },
    { name: 'Hisobotlar', enabled: 20, total: 22 },
    { name: 'Sozlamalar', enabled: 5, total: 5 },
  ],
  CASHIER: [
    { name: 'Kassa oynasi', enabled: 3, total: 3 },
  ],
};

export function getRoleBreakdown(businessTypeCode, roleCode) {
  if (businessTypeCode === 'RESTAURANT') {
    return RESTAURANT_BREAKDOWNS[roleCode] || [];
  }
  return DEFAULT_RETAIL_BREAKDOWN[roleCode] || [
    { name: 'Asosiy', enabled: 2, total: 3 },
    { name: 'Kassa oynasi', enabled: 3, total: 3 },
  ];
}
