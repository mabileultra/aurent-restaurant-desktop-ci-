import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformSecurityApi } from '../../../api';
import { calculateDaysAgo } from '../utils/securityFormatUtils';

/**
 * Xavfsizlik "Umumiy holat" tabi mantiq hooki.
 * @param {{ onSelectTab: (tabKey: string) => void }} options
 */
export function useSecurityOverviewFlow({ onSelectTab }) {
  const [doneOpen, setDoneOpen] = useState(false);

  // Kassa server paroli holatini olish
  const { data: cashierStatus } = useQuery({
    queryKey: ['platform-security-password'],
    queryFn: () => platformSecurityApi.getCashierServerPassword().then((r) => r.data),
    staleTime: 60000,
  });

  const { data: remoteAdmins = [] } = useQuery({
    queryKey: ['platform-security-super-admins'],
    queryFn: () => platformSecurityApi.listSuperAdmins().then((r) => r.data),
    staleTime: 60000,
  });

  // Dinamik tavsiyalar
  const recommendations = useMemo(() => {
    const list = [];
    const daysAgo = calculateDaysAgo(cashierStatus?.updatedAt);

    if (daysAgo !== null) {
      if (daysAgo >= 30) {
        list.push({
          id: 'rec-cashier-pwd-age',
          severity: daysAgo >= 90 ? 'high' : 'mid',
          title: `Kassa server paroli ${daysAgo} kundan beri o‘zgarmagan`,
          desc: 'Xavfsizlik talablariga muvofiq, kassa server sozlamalari parolini muntazam ravishda yangilab turish tavsiya etiladi.',
          action: 'Parolni almashtirish',
          targetTab: 'rules',
        });
      }
    } else if (cashierStatus && !cashierStatus.isSet && !cashierStatus.updatedAt) {
      list.push({
        id: 'rec-cashier-pwd-missing',
        severity: 'high',
        title: 'Kassa server sozlamalari paroli o‘rnatilmagan',
        desc: 'Desktop kassa sozlamalarini begona aralashuvlardan himoya qilish uchun yangi murakkab parol o‘rnating.',
        action: 'Parol o‘rnatish',
        targetTab: 'rules',
      });
    }

    // Xodimlarda email yo'qligi tekshiruvi
    const adminsWithoutEmail = Array.isArray(remoteAdmins)
      ? remoteAdmins.filter((a) => !a.email || /@platform\.local$/i.test(a.email))
      : [];
    if (adminsWithoutEmail.length > 0) {
      list.push({
        id: 'rec-staff-email',
        severity: 'mid',
        title: `${adminsWithoutEmail.length} ta xodimda to‘g‘ri email ko‘rsatilmagan`,
        desc: 'Parolni tiklash va tizim ogohlantirishlarini olish uchun haqiqiy elektron pochta manzili kiritilishi zarur.',
        action: 'Xodimlarni ko‘rish',
        targetTab: 'staff',
      });
    }

    return list;
  }, [cashierStatus, remoteAdmins]);

  const completedChecks = useMemo(() => {
    const checks = ['Super-admin roli uchun ruxsatlar chegaralangan'];
    if (cashierStatus?.isSet || cashierStatus?.updatedAt) {
      checks.push('Kassa server sozlamalari paroli o‘rnatilgan');
    }
    if (Array.isArray(remoteAdmins) && remoteAdmins.length > 0) {
      checks.push(`Tizimda ${remoteAdmins.length} ta administrator hisobi faol`);
    }
    return checks;
  }, [cashierStatus, remoteAdmins]);

  const kpis = useMemo(
    () => ({
      activeSessions: { count: '—', sub: 'Monitoring kutilmoqda' },
      failedLogins: { count: '0', sub: 'oxirgi 7 kunda' },
      newDevices: { count: '0', sub: 'oxirgi 7 kunda' },
      twoFactorEnabled: { count: '—', sub: 'Integratsiya kutilmoqda' },
    }),
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
    recommendations,
    completedChecks,
    doneOpen,
    toggleDone,
    loginBars: [],
    recentEvents: [],
    handleAction,
  };
}
