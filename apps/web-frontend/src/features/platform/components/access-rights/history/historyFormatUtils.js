import { resolveModuleName } from '../utils/accessRightsCatalogUtils';

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

const RU_MONTHS = [
  'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
  'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря',
];

export function formatHistoryDateHeader(dateInput, isRu = false) {
  if (!dateInput) return isRu ? 'Ранее' : 'Oldingi';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const monthName = isRu ? RU_MONTHS[d.getMonth()] : UZ_MONTHS[d.getMonth()];
  const dateStr = `${d.getDate()}-${monthName.toUpperCase()}`;

  if (isToday) {
    return isRu ? `СЕГОДНЯ · ${dateStr}` : `BUGUN · ${dateStr}`;
  }
  return dateStr;
}

export function formatHistoryTime(dateInput) {
  if (!dateInput) return '12:00';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '12:00';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatHistoryDiff(before = {}, after = {}, action = 'UPDATE', isRu = false) {
  if (action === 'RESET') {
    return isRu ? 'Все права сброшены к шаблону роли' : 'Barcha huquqlar rol shabloniga qaytarildi';
  }
  if (action === 'BULK_RESET') {
    return isRu ? 'Массовый сброс к шаблону роли' : 'Ommaviy ravishda rol shabloniga qaytarildi';
  }

  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const changes = [];

  keys.forEach((k) => {
    const b = Boolean(before?.[k]);
    const a = Boolean(after?.[k]);
    if (b !== a) {
      const modName = resolveModuleName(k, {}, isRu ? 'ru' : 'uz');
      if (a && !b) {
        changes.push(`+ ${modName} (${isRu ? 'разрешено' : 'ruxsat berildi'})`);
      } else {
        changes.push(`− ${modName} (${isRu ? 'запрещено' : 'taqiqlandi'})`);
      }
    }
  });

  if (changes.length === 0) {
    return isRu ? 'Параметры доступа обновлены' : 'Kirish huquqlari yangilandi';
  }

  return changes.join(', ');
}
