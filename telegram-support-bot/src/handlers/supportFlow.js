import { supportCategoryButtons, ticketButtons } from '../keyboards/inlineKeyboards.js';
import { homeOnlyKeyboard, mainReplyKeyboard } from '../keyboards/replyKeyboards.js';
import { escapeHtml, formatUser } from '../utils/telegramText.js';
import { STATES } from '../state/userStateStore.js';

export const SUPPORT_CATEGORIES = {
  not_found: 'Не нашёл лекарство',
  bad_price: 'Неверная цена',
  bad_stock: 'Неверный остаток',
  store: 'Проблема с аптекой',
  tech: 'Техническая проблема',
  other: 'Другая проблема',
};

export async function showSupportCategories(ctx, stateStore) {
  stateStore.setState(ctx.from.id, STATES.SUPPORT_CATEGORY, {
    supportCategory: null,
    activeTicketId: null,
  });
  await ctx.reply(
    '🆘 <b>Служба поддержки</b>\n\nС чем возникла проблема?',
    {
      parse_mode: 'HTML',
      ...supportCategoryButtons(),
    }
  );
}

export async function selectSupportCategory(ctx, code, stateStore) {
  await ctx.answerCbQuery().catch(() => {});
  const label = SUPPORT_CATEGORIES[code] || 'Другая проблема';
  stateStore.setState(ctx.from.id, STATES.SUPPORT_MESSAGE, {
    supportCategory: code,
    activeTicketId: null,
  });
  await ctx.reply(
    `Категория: <b>${escapeHtml(label)}</b>\n\nОпишите проблему одним сообщением.\n\nМожно отправить:\n• текст\n• фото\n• документ\n• геолокацию`,
    {
      parse_mode: 'HTML',
      ...homeOnlyKeyboard(),
    }
  );
}

async function forwardTextToGroup(telegram, groupId, text, parseMode = 'HTML') {
  return telegram.sendMessage(groupId, text, { parse_mode: parseMode });
}

export async function receiveSupportMessage(ctx, deps) {
  const { stateStore, dataStore, forwardToGroup, getGroupId } = deps;
  const state = stateStore.get(ctx.from.id);
  const code = state.supportCategory || 'other';
  const label = SUPPORT_CATEGORIES[code] || 'Другая проблема';

  let preview = ctx.message.text
    || ctx.message.caption
    || (ctx.message.photo ? '[фото]' : '')
    || (ctx.message.document ? '[документ]' : '')
    || (ctx.message.location ? '[геолокация]' : '')
    || '[сообщение]';

  const ticket = dataStore.createTicket(ctx.from.id, {
    category: code,
    categoryLabel: label,
    preview,
  });

  const { name, username, id } = formatUser(ctx.from);
  const groupText = [
    '📩 <b>Обращение поддержки</b>',
    `<b>№${ticket.id}</b>`,
    `<b>Категория:</b> ${escapeHtml(label)}`,
    `<b>От:</b> ${escapeHtml(name)} (${escapeHtml(username)})`,
    `<b>Telegram ID:</b> <code>${id}</code>`,
    '',
    '<b>Сообщение:</b>',
    escapeHtml(preview),
  ].join('\n');

  let deliveredToGroup = false;
  const groupId = getGroupId();
  if (groupId) {
    try {
      const sent = await forwardTextToGroup(ctx.telegram, groupId, groupText);
      dataStore.linkGroupMessage(ctx.from.id, ticket.id, sent.message_id);
      deliveredToGroup = true;

      if (ctx.message.photo?.length) {
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        const media = await ctx.telegram.sendPhoto(groupId, photo.file_id, {
          caption: `Обращение №${ticket.id}`,
          reply_to_message_id: sent.message_id,
        });
        dataStore.linkGroupMessage(ctx.from.id, ticket.id, media.message_id);
      } else if (ctx.message.document) {
        const media = await ctx.telegram.sendDocument(groupId, ctx.message.document.file_id, {
          caption: `Обращение №${ticket.id}`,
          reply_to_message_id: sent.message_id,
        });
        dataStore.linkGroupMessage(ctx.from.id, ticket.id, media.message_id);
      } else if (ctx.message.location) {
        const media = await ctx.telegram.sendLocation(
          groupId,
          ctx.message.location.latitude,
          ctx.message.location.longitude,
          { reply_to_message_id: sent.message_id }
        );
        dataStore.linkGroupMessage(ctx.from.id, ticket.id, media.message_id);
      }
    } catch (err) {
      console.error('Support forward error:', err.message || err);
    }
  } else if (forwardToGroup) {
    try {
      deliveredToGroup = Boolean(
        await forwardToGroup(ctx, `[№${ticket.id}] [${label}] ${preview}`)
      );
    } catch (err) {
      console.error('Support forward error:', err.message || err);
    }
  }

  stateStore.setState(ctx.from.id, STATES.SUPPORT_ACTIVE, {
    activeTicketId: ticket.id,
    supportCategory: code,
  });

  const lines = [
    `✅ Обращение <b>№${ticket.id}</b> принято.`,
    '',
    `Категория: ${escapeHtml(label)}`,
    'Статус: Новое',
    '',
  ];
  if (deliveredToGroup) {
    lines.push('Сотрудник поддержки ответит вам в этом чате.');
  } else {
    lines.push(
      '⚠️ Обращение сохранено, но группа поддержки сейчас недоступна.',
      'Администратору нужно добавить бота в группу поддержки.'
    );
  }

  await ctx.reply(lines.join('\n'), {
    parse_mode: 'HTML',
    ...ticketButtons(ticket.id),
  });
}

export async function showTicketStatus(ctx, ticketId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  const ticket = deps.dataStore.getTicket(ctx.from.id, ticketId);
  if (!ticket) {
    await ctx.reply('Обращение не найдено.');
    return;
  }
  await ctx.reply(
    [
      `📋 Обращение <b>№${ticket.id}</b>`,
      `Категория: ${escapeHtml(ticket.categoryLabel)}`,
      `Статус: <b>${escapeHtml(ticket.status)}</b>`,
      ticket.closed ? 'Закрыто' : 'Открыто',
    ].join('\n'),
    { parse_mode: 'HTML', ...ticketButtons(ticket.id) }
  );
}

export async function prepareTicketAppend(ctx, ticketId, stateStore) {
  await ctx.answerCbQuery().catch(() => {});
  stateStore.setState(ctx.from.id, STATES.SUPPORT_MESSAGE, {
    activeTicketId: Number(ticketId),
    supportCategory: 'other',
  });
  await ctx.reply('Отправьте дополнение к обращению (текст / фото / документ).', homeOnlyKeyboard());
}

export async function appendOrCreateSupport(ctx, deps) {
  const state = deps.stateStore.get(ctx.from.id);
  if (state.activeTicketId && state.state === STATES.SUPPORT_MESSAGE) {
    const existing = deps.dataStore.getTicket(ctx.from.id, state.activeTicketId);
    if (existing && !existing.closed) {
      const note = ctx.message.text || ctx.message.caption || '[медиа]';
      deps.dataStore.appendTicketNote(ctx.from.id, existing.id, note);
      const groupId = deps.getGroupId();
      let deliveredToGroup = false;
      if (groupId) {
        try {
          const sent = await forwardTextToGroup(
            ctx.telegram,
            groupId,
            [
              `➕ Дополнение к обращению <b>№${existing.id}</b>`,
              `<b>Telegram ID:</b> <code>${ctx.from.id}</code>`,
              '',
              escapeHtml(note),
            ].join('\n')
          );
          deps.dataStore.linkGroupMessage(ctx.from.id, existing.id, sent.message_id);
          deliveredToGroup = true;
        } catch (err) {
          console.error('Support append forward error:', err.message || err);
        }
      }
      deps.stateStore.setState(ctx.from.id, STATES.SUPPORT_ACTIVE, {
        activeTicketId: existing.id,
      });
      const text = deliveredToGroup
        ? `✅ Дополнение к обращению №${existing.id} принято.`
        : `✅ Дополнение к обращению №${existing.id} сохранено.\n⚠️ Группа поддержки сейчас недоступна.`;
      await ctx.reply(text, ticketButtons(existing.id));
      return;
    }
  }
  await receiveSupportMessage(ctx, deps);
}

export async function closeTicket(ctx, ticketId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  const ticket = deps.dataStore.closeTicket(ctx.from.id, ticketId);
  if (!ticket) {
    await ctx.reply('Обращение не найдено.');
    return;
  }
  deps.stateStore.resetToMain(ctx.from.id);
  await ctx.reply(`Обращение №${ticket.id} закрыто.`, mainReplyKeyboard());
}
