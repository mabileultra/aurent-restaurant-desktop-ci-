import { useMemo } from 'react';
import { addHours } from 'date-fns';
import { formatUzbekDate } from '../components/desktop-notifications/desktopNotificationFormatters';

export function useDesktopNotificationTiming({
  duration,
  customHours,
  scheduleType = 'NOW',
  scheduleDate = '',
  scheduleTime = '09:00',
}) {
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

  const scheduledDateObj = useMemo(() => {
    if (scheduleType !== 'SCHEDULED' || !scheduleDate) return null;
    const parts = scheduleDate.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const timeParts = (scheduleTime || '00:00').split(':').map(Number);
    const hours = isNaN(timeParts[0]) ? 0 : timeParts[0];
    const minutes = isNaN(timeParts[1]) ? 0 : timeParts[1];
    return new Date(parts[0], parts[1] - 1, parts[2], hours, minutes, 0);
  }, [scheduleType, scheduleDate, scheduleTime]);

  const isScheduleInFuture = useMemo(() => {
    if (scheduleType !== 'SCHEDULED') return true;
    if (!scheduledDateObj) return false;
    return scheduledDateObj.getTime() > Date.now();
  }, [scheduleType, scheduledDateObj]);

  const isScheduleValid = useMemo(() => {
    if (scheduleType === 'NOW') return true;
    return Boolean(scheduleDate && scheduleTime && isScheduleInFuture);
  }, [scheduleType, scheduleDate, scheduleTime, isScheduleInFuture]);

  const scheduledAtIso = useMemo(() => {
    if (scheduleType !== 'SCHEDULED' || !isScheduleValid || !scheduledDateObj) return null;
    return scheduledDateObj.toISOString();
  }, [scheduleType, isScheduleValid, scheduledDateObj]);

  const scheduledFormatted = useMemo(() => {
    if (!scheduledDateObj) return '';
    return formatUzbekDate(scheduledDateObj, 'd-MMMM yyyy, HH:mm', 'uz');
  }, [scheduledDateObj]);

  const visibleUntilFormatted = useMemo(() => {
    if (expiresInHours == null || !isCustomHoursValid) return '';
    try {
      const baseDate = scheduleType === 'SCHEDULED' && scheduledDateObj && isScheduleInFuture
        ? scheduledDateObj
        : new Date();
      const targetDate = addHours(baseDate, expiresInHours);
      const isDifferentYear = targetDate.getFullYear() !== baseDate.getFullYear();
      return formatUzbekDate(targetDate, isDifferentYear ? 'd-MMMM yyyy, HH:mm' : 'd-MMMM, HH:mm', 'uz');
    } catch {
      return '';
    }
  }, [expiresInHours, isCustomHoursValid, scheduleType, scheduledDateObj, isScheduleInFuture]);

  return {
    isCustomHoursValid,
    expiresInHours,
    visibleUntilFormatted,
    isScheduleValid,
    isScheduleInFuture,
    scheduledAtIso,
    scheduledFormatted,
  };
}
