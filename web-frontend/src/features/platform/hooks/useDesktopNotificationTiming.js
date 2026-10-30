import { useMemo } from 'react';
import { addHours } from 'date-fns';
import { formatUzbekDate } from '../components/desktop-notifications/desktopNotificationFormatters';

export function useDesktopNotificationTiming({ duration, customHours }) {
  const isCustomHoursValid = useMemo(() => {
    if (duration !== 'other') return true;
    const trimmed = String(customHours ?? '').trim();
    if (!trimmed) return false;
    const num = Number(trimmed);
    return Number.isInteger(num) && num >= 1 && num <= 720;
  }, [duration, customHours]);

  const expiresInHours = useMemo(() => {
    switch (duration) {
      case '1d':
        return 24;
      case '3d':
        return 72;
      case '1w':
        return 168;
      case 'other': {
        const trimmed = String(customHours ?? '').trim();
        if (!trimmed) return null;
        const num = Number(trimmed);
        return Number.isInteger(num) && num >= 1 && num <= 720 ? num : null;
      }
      default:
        return 72;
    }
  }, [duration, customHours]);

  const visibleUntilFormatted = useMemo(() => {
    if (expiresInHours == null || !isCustomHoursValid) return '';
    try {
      const now = new Date();
      const targetDate = addHours(now, expiresInHours);
      const isDifferentYear = targetDate.getFullYear() !== now.getFullYear();
      return formatUzbekDate(targetDate, isDifferentYear ? 'd-MMMM yyyy, HH:mm' : 'd-MMMM, HH:mm', 'uz');
    } catch {
      return '';
    }
  }, [expiresInHours, isCustomHoursValid]);

  return {
    isCustomHoursValid,
    expiresInHours,
    visibleUntilFormatted,
  };
}
