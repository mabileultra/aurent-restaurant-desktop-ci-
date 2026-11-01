// Standart rol shablonlari va faoliyat turlari (PDF dizayniga muvofiq)
export const DEFAULT_KPI_STATS = {
  totalEmployees: 338,
  templateOnlyCount: 294,
  exceptionCount: 44,
  businessTypesCount: 9,
};

export const BUSINESS_TYPES_CATALOG = [
  {
    code: 'RESTAURANT',
    name: 'Restoran',
    totalEmployees: 145,
    roles: [
      { code: 'ADMIN', name: 'Admin', totalEmployees: 14, exceptionCount: 1, enabledModulesCount: 58, totalModulesCount: 59 },
      { code: 'MANAGER', name: 'Menejer', totalEmployees: 9, exceptionCount: 2, enabledModulesCount: 54, totalModulesCount: 59 },
      { code: 'CASHIER', name: 'Kassir', totalEmployees: 21, exceptionCount: 3, enabledModulesCount: 3, totalModulesCount: 3 },
      { code: 'WAITER', name: 'Ofitsiant', totalEmployees: 98, exceptionCount: 5, enabledModulesCount: 6, totalModulesCount: 7 },
      { code: 'COOK', name: 'Oshpaz', totalEmployees: 3, exceptionCount: 0, enabledModulesCount: 2, totalModulesCount: 2 },
    ],
  },
  {
    code: 'PHARMACY',
    name: 'Dorixona',
    totalEmployees: 19,
    roles: [
      { code: 'ADMIN', name: 'Admin', totalEmployees: 6, exceptionCount: 1, enabledModulesCount: 50, totalModulesCount: 51 },
      { code: 'MANAGER', name: 'Menejer', totalEmployees: 2, exceptionCount: 0, enabledModulesCount: 46, totalModulesCount: 51 },
      { code: 'CASHIER', name: 'Kassir', totalEmployees: 11, exceptionCount: 2, enabledModulesCount: 3, totalModulesCount: 3 },
    ],
  },
  {
    code: 'GROCERY',
    name: 'Oziq-ovqat',
    totalEmployees: 72,
    roles: [
      { code: 'ADMIN', name: 'Admin', totalEmployees: 31, exceptionCount: 4, enabledModulesCount: 50, totalModulesCount: 51 },
      { code: 'MANAGER', name: 'Menejer', totalEmployees: 3, exceptionCount: 0, enabledModulesCount: 46, totalModulesCount: 51 },
      { code: 'CASHIER', name: 'Kassir', totalEmployees: 38, exceptionCount: 6, enabledModulesCount: 3, totalModulesCount: 3 },
    ],
  },
  {
    code: 'GENERAL',
    name: 'Universal / Gipermarket',
    totalEmployees: 31,
    roles: [
      { code: 'ADMIN', name: 'Admin', totalEmployees: 12, exceptionCount: 2, enabledModulesCount: 50, totalModulesCount: 51 },
      { code: 'MANAGER', name: 'Menejer', totalEmployees: 2, exceptionCount: 1, enabledModulesCount: 46, totalModulesCount: 51 },
      { code: 'CASHIER', name: 'Kassir', totalEmployees: 17, exceptionCount: 3, enabledModulesCount: 3, totalModulesCount: 3 },
    ],
  },
];

export const MODULE_GROUPS_CATALOG = [
  {
    id: 'main',
    title: 'Asosiy',
    modules: [
      { id: 'dashboard', name: 'Boshqaruv paneli', description: 'Umumiy ko‘rsatkichlar va analitika' },
      { id: 'ai_assistant', name: 'AI-assistent', description: 'Aqlli yordamchi va tavsiyalar' },
      { id: 'payments', name: 'To‘lov', description: 'To‘lovlarni qabul qilish va tekshirish' },
    ],
  },
  {
    id: 'products',
    title: 'Tovarlar',
    modules: [
      { id: 'catalog', name: 'Kategoriyalar', description: 'Mahsulotlar katalogi va kategoriyalar' },
    ],
  },
  {
    id: 'warehouse',
    title: 'Ombor',
    modules: [
      { id: 'stock_products', name: 'Tovarlar', description: 'Ombor mahsulotlari' },
      { id: 'suppliers', name: 'Yetkazib beruvchilar', description: 'Kontragentlar ro‘yxati' },
      { id: 'stock_incomes', name: 'Kirim (hujjat)', description: 'Mahsulot kirim qilish' },
      { id: 'inventory', name: 'Inventarizatsiya', description: 'Qoldiq va qayta sanash' },
      { id: 'transfers', name: 'Ko‘chirish', description: 'Filiallararo tovar o‘tkazish' },
    ],
  },
  {
    id: 'orders',
    title: 'Buyurtmalar',
    modules: [
      { id: 'orders_list', name: 'Buyurtmalar', description: 'Barcha buyurtmalar ro‘yxati' },
    ],
  },
  {
    id: 'finance',
    title: 'Moliya',
    modules: [
      { id: 'fin_dashboard', name: 'Boshqaruv paneli', description: 'Moliyaviy hisobotlar' },
      { id: 'fin_debts', name: 'Qarzlar', description: 'Mijoz va ta‘minotchi qarzlari' },
      { id: 'fin_incomes', name: 'Tushumlar', description: 'Barcha kassa va hisob tushumlari' },
      { id: 'fin_expenses', name: 'Xarajatlar', description: 'Kompaniya xarajatlari' },
      { id: 'fin_cashboxes', name: 'Kassalar', description: 'Kassa qoldiqlari' },
      { id: 'fin_transfers', name: 'O‘tkazmalar', description: 'Pul ko‘chirish' },
      { id: 'fin_reports', name: 'Hisobotlar', description: 'Foyda va zarar hisoboti' },
      { id: 'fin_journal', name: 'Jurnal', description: 'Moliyaviy operatsiyalar jurnali' },
      { id: 'fin_categories', name: 'Kategoriyalar', description: 'Xarajat turlari' },
      { id: 'fin_sync', name: 'Sinxronizatsiya', description: 'Bank va soliq integratsiyasi' },
    ],
  },
  {
    id: 'cash_registers',
    title: 'Kassalar',
    modules: [
      { id: 'cr_list', name: 'Kassalar ro‘yxati', description: 'Faol va oflayn kassalar' },
      { id: 'cr_z_reports', name: 'Z-hisobotlar', description: 'Smena yopish hisobotlari' },
      { id: 'cr_cashier_task', name: 'Kassa topshirig‘i', description: 'Kassirga berilgan vazifalar' },
      { id: 'cr_settings', name: 'Kassa sozlamalari', description: 'Chek va printer sozlamalari' },
    ],
  },
  {
    id: 'restaurant',
    title: 'Restoran',
    modules: [
      { id: 'rst_hall', name: 'Zal va stollar', description: 'Interaktiv zal xaritasi' },
      { id: 'rst_bill', name: 'Hisob berish', description: 'Pre-check chiqarish' },
      { id: 'rst_label', name: 'Berish etiketi', description: 'Stol va idish yorliqlari' },
      { id: 'rst_customer_screen', name: 'Xaridor ekrani', description: 'Mijoz monitori' },
      { id: 'rst_fast_bill', name: 'Tez chek', description: 'Tezkor hisob chiqarish' },
      { id: 'rst_booking', name: 'Bronlash', description: 'Stollarni band qilish' },
      { id: 'rst_delivery', name: 'Yetkazib berish', description: 'Yetkazib berish boshqaruvi' },
      { id: 'rst_kitchen', name: 'Oshxona (KDS)', description: 'Oshxona ekrani' },
    ],
  },
  {
    id: 'pos_window',
    title: 'Kassa oynasi',
    modules: [
      { id: 'pos_sales', name: 'Sotuv', description: 'Asosiy savdo oynasi' },
      { id: 'pos_my_receipts', name: 'Mening cheklarim', description: 'Smena cheklari' },
      { id: 'pos_offline', name: 'Oflayn rejim', description: 'Internetsiz ishlash' },
    ],
  },
];
