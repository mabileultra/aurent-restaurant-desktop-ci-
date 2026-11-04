import { Markup } from 'telegraf';
import { WEB_SUPPORT_CATEGORIES } from './categories.js';

export function categoryKeyboard() {
  const rows = Object.entries(WEB_SUPPORT_CATEGORIES).map(([code, label]) => [
    Markup.button.callback(label, `cat:${code}`),
  ]);
  return Markup.inlineKeyboard(rows);
}

export function ticketKeyboard(ticketId) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📋 Статус', `tstat:${ticketId}`),
      Markup.button.callback('➕ Дополнить', `tadd:${ticketId}`),
    ],
    [Markup.button.callback('✅ Закрыть', `tclose:${ticketId}`)],
  ]);
}

export function homeKeyboard() {
  return Markup.keyboard([['🆘 Поддержка'], ['ℹ️ Помощь']]).resize();
}
