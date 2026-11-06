import {
  supportCategoryButtons,
  ticketButtons,
  homeKeyboard,
  mainMenuKeyboard,
} from '../keyboards/menus.js';
import {
  supportMenuText,
  supportAskMessageText,
} from '../texts/messages.js';
import { STATES } from '../state/userStateStore.js';
import { escapeHtml, formatUser } from '../utils/telegramText.js';

export const SUPPORT_CATEGORIES = {
  not_found: { code: 'MEDICINE_NOT_FOUND', label: 'Не нашёл лекарство' },
  bad_price: { code: 'WRONG_PRICE', label: 'Неверная цена' },
  bad_stock: { code: 'WRONG_STOCK', label: 'Неверный остаток' },
  store: { code: 'PHARMACY_PROBLEM', label: 'Проблема с аптекой' },
  tech: { code: 'TECHNICAL_PROBLEM', label: 'Техническая проблема' },
  other: { code: 'OTHER', label: 'Другая проблема' },
};

export async function showSupportMenu(ctx, stateStore) {
  stateStore.setState(ctx.from.id, STATES.SUPPORT_MENU, {
    supportCategory: null,
  });
  await ctx.reply(supportMenuText(), {
    parse_mode: 'HTML',
    ...supportCategoryButtons(),
  });
}

export async function selectSupportCategory(ctx, key, stateStore) {
  await ctx.answerCbQuery().catch(() => {});
  const cat = SUPPORT_CATEGORIES[key] || SUPPORT_CATEGORIES.other;
  stateStore.setState(ctx.from.id, STATES.SUPPORT_WAITING_MESSAGE, {
    supportCategory: key,
    activeTicketId: null,
  });
  await ctx.reply(supportAskMessageText(cat.label), {
    parse_mode: 'HTML',
    ...homeKeyboard(),
  });
}

async function forwardToGroup(ctx, deps, groupText, ticketId) {
  const groupId = deps.getGroupId();
  if (!groupId) return false;
  const sent = await ctx.telegram.sendMessage(groupId, groupText, { parse_mode: 'HTML' });
  deps.dataStore.linkGroupMessage(ctx.from.id, ticketId, sent.message_id);

  if (ctx.message.photo?.length) {
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const media = await ctx.telegram.sendPhoto(groupId, photo.file_id, {
      caption: `Обращение №${ticketId}`,
      reply_to_message_id: sent.message_id,
    });
    deps.dataStore.linkGroupMessage(ctx.from.id, ticketId, media.message_id);
  } else if (ctx.message.document) {
    const media = await ctx.telegram.sendDocument(groupId, ctx.message.document.file_id, {
      caption: `Обращение №${ticketId}`,
      reply_to_message_id: sent.message_id,
    });
    deps.dataStore.linkGroupMessage(ctx.from.id, ticketId, media.message_id);
  }
  return true;
}

export async function receiveSupportMessage(ctx, deps) {
  const state = deps.stateStore.get(ctx.from.id);
  const key = state.supportCategory || 'other';
  const cat = SUPPORT_CATEGORIES[key] || SUPPORT_CATEGORIES.other;
  const preview = ctx.message.text
    || ctx.message.caption
    || (ctx.message.photo ? '[фото]' : '')
    || (ctx.message.document ? '[документ]' : '')
    || '[сообщение]';

  const ticket = deps.dataStore.createTicket(ctx.from.id, {
    category: cat.code,
    categoryLabel: cat.label,
    preview,
  });

  const { name, username, id } = formatUser(ctx.from);
  const groupText = [
    '📩 <b>Обращение аптечного бота</b>',
    `<b>№${ticket.id}</b>`,
    `<b>Статус:</b> OPEN`,
    `<b>Категория:</b> ${escapeHtml(cat.label)} (${cat.code})`,
    `<b>От:</b> ${escapeHtml(name)} (${escapeHtml(username)})`,
    `<b>Telegram ID:</b> <code>${id}</code>`,
    '',
    '<b>Сообщение:</b>',
    escapeHtml(preview),
  ].join('\n');

  let delivered = false;
  try {
    delivered = await forwardToGroup(ctx, deps, groupText, ticket.id);
  } catch (err) {
    console.error('Support forward error:', err.message || err);
  }

  deps.stateStore.setState(ctx.from.id, STATES.SUPPORT_ACTIVE, {
    activeTicketId: ticket.id,
    supportCategory: key,
  });

  const lines = [
    '✅ Обращение принято.',
    '',
    `Номер обращения: <b>#${ticket.id}</b>`,
    `Категория: ${escapeHtml(cat.label)}`,
    '',
  ];
  if (delivered) {
    lines.push('Мы передали информацию в службу поддержки.', 'Ответ придёт в этот чат.');
  } else {
    lines.push(
      '⚠️ Обращение сохранено, но группа поддержки недоступна.',
      'Администратору нужно добавить бота в группу.'
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
      `📋 Обращение <b>#${ticket.id}</b>`,
      `Категория: ${escapeHtml(ticket.categoryLabel)}`,
      `Статус: <b>${escapeHtml(ticket.status)}</b>`,
      ticket.closed ? 'Закрыто' : 'Открыто',
    ].join('\n'),
    { parse_mode: 'HTML', ...ticketButtons(ticket.id) }
  );
}

export async function prepareTicketAppend(ctx, ticketId, stateStore) {
  await ctx.answerCbQuery().catch(() => {});
  stateStore.setState(ctx.from.id, STATES.SUPPORT_WAITING_MESSAGE, {
    activeTicketId: Number(ticketId),
    supportCategory: 'other',
  });
  await ctx.reply('Отправьте дополнение к обращению.', homeKeyboard());
}

export async function appendOrCreateSupport(ctx, deps) {
  const state = deps.stateStore.get(ctx.from.id);
  if (state.activeTicketId && state.state === STATES.SUPPORT_WAITING_MESSAGE) {
    const existing = deps.dataStore.getTicket(ctx.from.id, state.activeTicketId);
    if (existing && !existing.closed) {
      const note = ctx.message.text || ctx.message.caption || '[медиа]';
      deps.dataStore.appendTicketNote(ctx.from.id, existing.id, note);
      const groupId = deps.getGroupId();
      if (groupId) {
        try {
          const sent = await ctx.telegram.sendMessage(
            groupId,
            [
              `➕ Дополнение к <b>#${existing.id}</b>`,
              `<b>Telegram ID:</b> <code>${ctx.from.id}</code>`,
              '',
              escapeHtml(note),
            ].join('\n'),
            { parse_mode: 'HTML' }
          );
          deps.dataStore.linkGroupMessage(ctx.from.id, existing.id, sent.message_id);
        } catch (err) {
          console.error(err);
        }
      }
      deps.stateStore.setState(ctx.from.id, STATES.SUPPORT_ACTIVE, {
        activeTicketId: existing.id,
      });
      await ctx.reply(`✅ Дополнение к #${existing.id} принято.`, ticketButtons(existing.id));
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
  await ctx.reply(`Обращение #${ticket.id} закрыто.`, mainMenuKeyboard());
}
