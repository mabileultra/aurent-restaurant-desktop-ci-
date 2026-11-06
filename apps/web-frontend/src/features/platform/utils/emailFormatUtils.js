export function formatNumberWithSpaces(num) {
  if (num == null || isNaN(Number(num))) return '0';
  return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function getHistoryStatusBadge(row) {
  if (row.queued > 0) {
    return {
      label: 'Yuborilmoqda',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    };
  }
  if (row.fail === 0) {
    return {
      label: 'Yetkazildi',
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400',
    };
  }
  if (row.ok === 0) {
    return {
      label: 'Yetkazilmadi',
      className: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
    };
  }
  return {
    label: 'Qisman',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
  };
}

export function getHistoryTypeBadge(type) {
  switch (type) {
    case 'bulk':
      return {
        label: 'Ommaviy',
        className: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
      };
    case 'cred':
      return {
        label: 'Kirish ma’lumotlari',
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      };
    case 'login':
      return {
        label: 'Super-admin kirishi',
        className: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
      };
    default:
      return {
        label: type,
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      };
  }
}
