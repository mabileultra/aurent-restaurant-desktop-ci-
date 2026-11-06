import { escapeHtml } from '../utils/telegramText.js';

/**
 * Ответ сотрудника в группе поддержки → пользователю в личку.
 * Сотрудник должен ответить Reply на сообщение бота с обращением.
 */
export async function handleSupportGroupReply(ctx, { dataStore, getGroupId }) {
  const groupId = getGroupId();
  if (!groupId || String(ctx.chat.id) !== String(groupId)) {
    return false;
  }
  if (ctx.from?.is_bot) {
    return false;
  }

  const reply = ctx.message.reply_to_message;
  if (!reply) {
    return false;
  }

  let link = dataStore.resolveGroupMessage(reply.message_id);
  if (!link) {
    const text = reply.text || reply.caption || '';
    const idMatch = text.match(/Telegram ID:.*?(\d{5,})/s);
    const ticketMatch = text.match(/№(\d+)/);
    if (idMatch) {
      link = {
        userId: Number(idMatch[1]),
        ticketId: ticketMatch ? Number(ticketMatch[1]) : null,
      };
    }
  }

  const replyFromBot = Boolean(reply.from?.is_bot);
  if (!link?.userId) {
    if (replyFromBot) {
      await ctx.reply(
        'Чтобы ответить клиенту, сделайте Reply на сообщение бота с обращением (там есть Telegram ID).'
      ).catch(() => {});
      return true;
    }
    return false;
  }

  try {
    await deliverReplyToUser(ctx, link.userId);
    if (link.ticketId) {
      dataStore.setTicketStatus(link.userId, link.ticketId, 'IN_PROGRESS');
    }
    await ctx.reply('✅ Ответ отправлен клиенту.').catch(() => {});
  } catch (err) {
    console.error('Support group reply error:', err);
    await ctx.reply(
      `Не удалось доставить ответ пользователю ${link.userId}: ${err.message || 'ошибка'}`
    ).catch(() => {});
  }
  return true;
}

async function deliverReplyToUser(ctx, userId) {
  const prefix = '💬 <b>Ответ поддержки</b>\n\n';
  const msg = ctx.message;

  if (msg.text) {
    await ctx.telegram.sendMessage(userId, `${prefix}${escapeHtml(msg.text)}`, {
      parse_mode: 'HTML',
    });
    return;
  }
  if (msg.caption) {
    const caption = `${prefix}${escapeHtml(msg.caption)}`;
    if (msg.photo?.length) {
      await ctx.telegram.sendPhoto(userId, msg.photo[msg.photo.length - 1].file_id, {
        caption,
        parse_mode: 'HTML',
      });
      return;
    }
    if (msg.document) {
      await ctx.telegram.sendDocument(userId, msg.document.file_id, {
        caption,
        parse_mode: 'HTML',
      });
      return;
    }
  }
  if (msg.photo?.length) {
    await ctx.telegram.sendMessage(userId, prefix, { parse_mode: 'HTML' });
    await ctx.telegram.sendPhoto(userId, msg.photo[msg.photo.length - 1].file_id);
    return;
  }
  if (msg.document) {
    await ctx.telegram.sendMessage(userId, prefix, { parse_mode: 'HTML' });
    await ctx.telegram.sendDocument(userId, msg.document.file_id);
    return;
  }
  if (msg.location) {
    await ctx.telegram.sendMessage(userId, `${prefix}Геолокация`, { parse_mode: 'HTML' });
    await ctx.telegram.sendLocation(userId, msg.location.latitude, msg.location.longitude);
    return;
  }

  await ctx.telegram.sendMessage(
    userId,
    `${prefix}Сотрудник отправил сообщение. Откройте поддержку ещё раз, если нужно уточнение.`,
    { parse_mode: 'HTML' }
  );
}
