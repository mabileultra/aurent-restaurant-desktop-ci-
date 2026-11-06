import { Activity, BarChart3, Building, FileText, Receipt, ShieldCheck } from 'lucide-react';

export const REPORT_TYPES = [
  { id: 'republic', title: 'Respublika bo‘yicha umumiy aylanma', desc: 'KPI, dinamika, fiskal ulush', icon: BarChart3 },
  { id: 'regions', title: 'Hududlar bo‘yicha aylanma', desc: 'Viloyat va tumanlar, o‘zgarish', icon: FileText },
  { id: 'companies', title: 'Korxonalar bo‘yicha aylanma', desc: 'Fiskal, nofiskal, farq va o‘zgarish', icon: Building },
  { id: 'fiscal_share', title: 'Fiskal va nofiskal aylanma', desc: 'Ulush va haftalar kesimida', icon: BarChart3 },
  { id: 'connection', title: 'Fiskal tizimga ulanish', desc: 'Ulangan, ulanmagan, yangi ulanishlar', icon: ShieldCheck },
  { id: 'activity', title: 'Korxonalar faolligi', desc: 'Oxirgi faollik, savdo kunlari', icon: Activity },
  { id: 'receipts', title: 'Cheklar bo‘yicha hisobot', desc: 'Cheklar, summalar, QR holati', icon: Receipt },
];

export const EXPORT_HISTORY = [
  { id: '1', report: 'Korxonalar bo‘yicha aylanma', period: 'Oxirgi davr', filters: 'Barchasi', rows: 114, format: 'Excel', status: 'ready' },
  { id: '2', report: 'Hududlar bo‘yicha aylanma', period: 'Oxirgi davr', filters: 'Barchasi', rows: 15, format: 'CSV', status: 'ready' },
  { id: '3', report: 'Cheklar bo‘yicha hisobot', period: '24-okt', filters: 'Farina Invest', rows: 51, format: 'Excel', status: 'ready' },
];
