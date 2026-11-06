import { useMemo, useState } from 'react';

const INITIAL_RECOMMENDATIONS = [
  {
    id: 'r1',
    severity: 'high',
    title: '2 ta xodimda ikki bosqichli tasdiqlash o‘chirilgan',
    desc: 'Operator Platform va Analitika Analitika hisoblari faqat parol bilan himoyalangan.',
    action: '2FA’ni majburiy qilish',
    targetTab: 'rules',
  },
  {
    id: 'r2',
    severity: 'high',
    title: 'Xodimlarning email manzili ishlamaydi',
    desc: 'superadmin@platform.local manzillariga xat yetib bormaydi — kirish ogohlantirishlari va parolni tiklash ishlamaydi.',
    action: 'Manzillarni yangilash',
    targetTab: 'staff',
  },
  {
    id: 'r3',
    severity: 'mid',
    title: 'Kassa server paroli 43 kundan beri o‘zgarmagan',
    desc: 'Har 90 kunda kassa server sozlamalari parolini yangilash tavsiya etiladi.',
    action: 'Parolni almashtirish',
    targetTab: 'rules',
  },
  {
    id: 'r4',
    severity: 'mid',
    title: 'Faolsizlikda avtomatik chiqish yo‘q',
    desc: 'Ochiq qolgan brauzerda super-admin seansi muddatsiz faol turadi.',
    action: 'Seans muddatini belgilash',
    targetTab: 'rules',
  },
  {
    id: 'r5',
    severity: 'low',
    title: 'IP cheklovi o‘chirilgan',
    desc: 'Super-admin paneliga istalgan tarmoqdan kirish mumkin.',
    action: 'Sozlash',
    targetTab: 'rules',
  },
];

const COMPLETED_CHECKS = [
  'Kassa server sozlamalari paroli o‘rnatilgan (standart parol ishlatilmayapti)',
  'Super-admin roli faqat 1 ta xodimda',
  'Barcha xodimlar hisobi faol va egasi aniq',
  'Super-admin kirishlari haqida email ogohlantirish yoqilgan',
];

const RECENT_SECURITY_EVENTS = [
  {
    id: 'e1',
    type: 'login',
    tone: 'ok',
    title: 'Administrator Super tizimga kirdi',
    meta: 'Chrome · Linux · 213.230.98.17 · Samarqand',
    time: '12:31',
  },
  {
    id: 'e2',
    type: 'warn',
    tone: 'bad',
    title: '3 marta noto‘g‘ri parol: platformadmin',
    meta: '185.139.137.4 · Toshkent · hisob 15 daqiqaga bloklandi',
    time: '11:58',
  },
  {
    id: 'e3',
    type: 'key',
    tone: 'info',
    title: 'Analitika Analitika parolini almashtirdi',
    meta: 'Profil sozlamalari orqali',
    time: '10:42',
  },
  {
    id: 'e4',
    type: 'edit',
    tone: 'info',
    title: 'Operator Platform tarifni o‘zgartirdi',
    meta: 'XAN BALIQ MCHJ · Biznes → Standart',
    time: '09:15',
  },
  {
    id: 'e5',
    type: 'device',
    tone: 'warn',
    title: 'Yangi qurilmadan super-admin kirishi',
    meta: 'Safari · iPhone · 84.54.70.212 · Toshkent',
    time: 'kecha 22:47',
  },
];

const SEVEN_DAYS_STATS = [
  { day: '31-okt', ok: 12, fail: 1 },
  { day: '1-noy', ok: 9, fail: 0 },
  { day: '2-noy', ok: 14, fail: 2 },
  { day: '3-noy', ok: 11, fail: 0 },
  { day: '4-noy', ok: 8, fail: 3 },
  { day: '5-noy', ok: 3, fail: 0 },
  { day: '6-noy', ok: 10, fail: 1 },
];

/**
 * Xavfsizlik "Umumiy holat" tabi mantiq hooki.
 * @param {{ onSelectTab: (tabKey: string) => void }} options
 */
export function useSecurityOverviewFlow({ onSelectTab }) {
  const [doneOpen, setDoneOpen] = useState(false);

  const kpis = useMemo(
    () => ({
      activeSessions: { count: 4, sub: '3 ta xodim' },
      failedLogins: { count: 7, sub: 'oxirgi 7 kunda' },
      newDevices: { count: 2, sub: 'oxirgi 7 kunda' },
      twoFactorEnabled: { count: '1 / 3', sub: 'xodimda' },
    }),
    []
  );

  const maxLogins = 17;
  const loginBars = useMemo(
    () =>
      SEVEN_DAYS_STATS.map((item) => ({
        day: item.day,
        total: item.ok + item.fail,
        okHeight: Math.round((item.ok / maxLogins) * 110),
        failHeight: Math.round((item.fail / maxLogins) * 110),
      })),
    []
  );

  const toggleDone = () => setDoneOpen((prev) => !prev);

  const handleAction = (targetTab) => {
    if (onSelectTab && targetTab) {
      onSelectTab(targetTab);
    }
  };

  return {
    kpis,
    recommendations: INITIAL_RECOMMENDATIONS,
    completedChecks: COMPLETED_CHECKS,
    doneOpen,
    toggleDone,
    loginBars,
    recentEvents: RECENT_SECURITY_EVENTS,
    handleAction,
  };
}
