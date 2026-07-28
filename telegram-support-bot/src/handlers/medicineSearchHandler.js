import { formatMedicineSearchMessage } from '../format/medicineMessage.js';

/**
 * Поиск лекарства через backend API.
 */
export async function handleMedicineSearch(ctx, query, medicineApi) {
  const q = String(query || '').trim();
  if (q.length < 2) {
    await ctx.reply('Введите минимум 2 символа для поиска лекарства.\nПример: /find парацетамол');
    return;
  }

  await ctx.replyWithChatAction('typing');

  try {
    const data = await medicineApi.search(q);
    const text = formatMedicineSearchMessage(data);
    await ctx.reply(text, { parse_mode: 'HTML', disable_web_page_preview: true });
  } catch (err) {
    console.error('Medicine search error:', err);
    if (err.code === 'BOT_API_NOT_CONFIGURED') {
      await ctx.reply('Поиск лекарств пока не настроен на сервере. Напишите /support.');
      return;
    }
    if (err.status === 401 || err.status === 503) {
      await ctx.reply('Сервис поиска временно недоступен. Попробуйте позже или напишите /support.');
      return;
    }
    await ctx.reply(
      err.message
        ? `Не удалось выполнить поиск: ${err.message}`
        : 'Не удалось связаться с сервером. Попробуйте позже.'
    );
  }
}
