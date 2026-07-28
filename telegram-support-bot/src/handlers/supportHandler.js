import { formatUser } from '../utils/telegramText.js';

const CONFIRM = '✅ Спасибо! Ваше сообщение передано в службу поддержки. Мы ответим вам в ближайшее время.';

/**
 * Обрабатывает обращение в поддержку (текст / фото / документ).
 */
export async function handleSupportMessage(ctx, { forwardToGroup, getGroupId }) {
  const { name, username, id } = formatUser(ctx.from);
  const captionPrefix = `От ${username} (${name}), ID: ${id}`;
  const activeGroupId = getGroupId();

  let forwarded = false;

  if (ctx.message.text) {
    forwarded = await forwardToGroup(ctx, ctx.message.text);
  } else if (ctx.message.photo?.length) {
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const caption = ctx.message.caption?.trim() || '[фото без подписи]';
    forwarded = await forwardToGroup(ctx, caption);
    if (activeGroupId) {
      await ctx.telegram.sendPhoto(activeGroupId, photo.file_id, {
        caption: captionPrefix,
      });
    }
  } else if (ctx.message.document) {
    const caption = ctx.message.caption?.trim() || ctx.message.document.file_name || '[документ]';
    forwarded = await forwardToGroup(ctx, caption);
    if (activeGroupId) {
      await ctx.telegram.sendDocument(activeGroupId, ctx.message.document.file_id, {
        caption: captionPrefix,
      });
    }
  } else {
    forwarded = await forwardToGroup(ctx, '[сообщение без текста]');
  }

  await ctx.reply(
    forwarded
      ? CONFIRM
      : '✅ Сообщение получено. Группа поддержки подключается — мы ответим вам здесь в ближайшее время.'
  );
}
