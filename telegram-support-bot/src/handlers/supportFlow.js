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
  });
  await ctx.reply(
    `Категория: <b>${escapeHtml(label)}</b>\n\nОпишите проблему одним сообщением.\n\nМожно отправить:\n• текст\n• фото\n• документ\n• геолокацию`,
    {
      parse_mode: 'HTML',
      ...homeOnlyKeyboard(),
    }
  );
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

  const groupId = getGroupId();
  if (groupId) {
    try {
      await ctx.telegram.sendMessage(groupId, groupText, { parse_mode: 'HTML' });
      if (ctx.message.photo?.length) {
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        await ctx.telegram.sendPhoto(groupId, photo.file_id, {
          caption: `Обращение №${ticket.id}`,
        });
      } else if (ctx.message.document) {
        await ctx.telegram.sendDocument(groupId, ctx.message.document.file_id, {
          caption: `Обращение №${ticket.id}`,
        });
      } else if (ctx.message.location) {
        await ctx.telegram.sendLocation(
          groupId,
          ctx.message.location.latitude,
          ctx.message.location.longitude
        );
      }
    } catch (err) {
      console.error('Support forward error:', err);
    }
  } else if (forwardToGroup) {
    await forwardToGroup(ctx, `[№${ticket.id}] [${label}] ${preview}`);
  }

  stateStore.setState(ctx.from.id, STATES.SUPPORT_ACTIVE, {
    activeTicketId: ticket.id,
    supportCategory: code,
  });

  await ctx.reply(
    [
      `✅ Обращение <b>№${ticket.id}</b> принято.`,
      '',
      `Категория: ${escapeHtml(label)}`,
      'Статус: Новое',
      '',
      'Сотрудник поддержки ответит вам в этом чате.',
    ].join('\n'),
    {
      parse_mode: 'HTML',
      ...ticketButtons(ticket.id),
    }
  );
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
      if (groupId) {
        await ctx.telegram.sendMessage(
          groupId,
          `➕ Дополнение к обращению №${existing.id}:\n${escapeHtml(note)}`,
          { parse_mode: 'HTML' }
        );
      }
      deps.stateStore.setState(ctx.from.id, STATES.SUPPORT_ACTIVE, {
        activeTicketId: existing.id,
      });
      await ctx.reply(`✅ Дополнение к обращению №${existing.id} принято.`, ticketButtons(existing.id));
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
