import { escapeHtml } from '../utils/telegramText.js';

/**
 * Reply сотрудника в группе веб-поддержки → пользователю в личку.
 */
export async function handleGroupReply(ctx, { ticketStore, getGroupId }) {
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

  let link = ticketStore.resolveGroupMessage(reply.message_id);
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
        'Чтобы ответить, сделайте Reply на сообщение бота с обращением (там есть Telegram ID).'
      ).catch(() => {});
    }
    return Boolean(replyFromBot);
  }

  try {
    await deliverReply(ctx, link.userId);
    if (link.ticketId) {
      ticketStore.setTicketStatus(link.userId, link.ticketId, 'В работе');
    }
    await ctx.reply('✅ Ответ отправлен пользователю.').catch(() => {});
  } catch (err) {
    console.error('Web support group reply error:', err);
    await ctx.reply(
      `Не удалось доставить ответ ${link.userId}: ${err.message || 'ошибка'}`
    ).catch(() => {});
  }
  return true;
}

async function deliverReply(ctx, userId) {
  const prefix = '💬 <b>Ответ поддержки Aurent POS</b>\n\n';
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

  await ctx.telegram.sendMessage(
    userId,
    `${prefix}Сотрудник отправил сообщение.`,
    { parse_mode: 'HTML' }
  );
}
