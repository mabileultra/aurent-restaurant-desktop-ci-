import { WEB_SUPPORT_CATEGORIES } from '../categories.js';
import { categoryKeyboard, homeKeyboard, ticketKeyboard } from '../keyboards.js';
import { STATES } from '../state/userStateStore.js';
import { escapeHtml, formatUser } from '../utils/telegramText.js';

export async function showWelcome(ctx, stateStore) {
  stateStore.reset(ctx.from.id);
  await ctx.reply(
    [
      '👋 <b>Поддержка Aurent POS</b>',
      '',
      'Это бот для сотрудников CRM и кассы.',
      'Выберите тему обращения — сообщение уйдёт в службу поддержки.',
    ].join('\n'),
    { parse_mode: 'HTML', ...homeKeyboard() }
  );
  await showCategories(ctx, stateStore);
}

export async function showHelp(ctx, stateStore) {
  stateStore.reset(ctx.from.id);
  await ctx.reply(
    [
      'ℹ️ <b>Справка</b>',
      '',
      '1. Нажмите «Поддержка» или /support',
      '2. Выберите категорию',
      '3. Опишите проблему (текст, фото, документ)',
      '',
      'Ответ сотрудника придёт сюда же в личку.',
    ].join('\n'),
    { parse_mode: 'HTML', ...homeKeyboard() }
  );
}

export async function showCategories(ctx, stateStore) {
  stateStore.set(ctx.from.id, {
    state: STATES.WAIT_CATEGORY,
    category: null,
    activeTicketId: null,
  });
  await ctx.reply('🆘 <b>С чем нужна помощь?</b>', {
    parse_mode: 'HTML',
    ...categoryKeyboard(),
  });
}

export async function selectCategory(ctx, code, stateStore) {
  await ctx.answerCbQuery().catch(() => {});
  const label = WEB_SUPPORT_CATEGORIES[code] || WEB_SUPPORT_CATEGORIES.other;
  stateStore.set(ctx.from.id, {
    state: STATES.WAIT_MESSAGE,
    category: code,
    activeTicketId: null,
  });
  await ctx.reply(
    `Категория: <b>${escapeHtml(label)}</b>\n\nОпишите проблему одним сообщением.\nМожно отправить текст, фото или документ.`,
    { parse_mode: 'HTML', ...homeKeyboard() }
  );
}

export async function receiveSupportMessage(ctx, deps) {
  const { stateStore, ticketStore, getGroupId } = deps;
  const state = stateStore.get(ctx.from.id);
  const code = state.category || 'other';
  const label = WEB_SUPPORT_CATEGORIES[code] || WEB_SUPPORT_CATEGORIES.other;

  const preview = ctx.message.text
    || ctx.message.caption
    || (ctx.message.photo ? '[фото]' : '')
    || (ctx.message.document ? '[документ]' : '')
    || '[сообщение]';

  const ticket = ticketStore.createTicket(ctx.from.id, {
    category: code,
    categoryLabel: label,
    preview,
  });

  const { name, username, id } = formatUser(ctx.from);
  const groupText = [
    '📩 <b>Обращение POS / CRM</b>',
    `<b>№${ticket.id}</b>`,
    `<b>Категория:</b> ${escapeHtml(label)}`,
    `<b>От:</b> ${escapeHtml(name)} (${escapeHtml(username)})`,
    `<b>Telegram ID:</b> <code>${id}</code>`,
    '',
    '<b>Сообщение:</b>',
    escapeHtml(preview),
  ].join('\n');

  let delivered = false;
  const groupId = getGroupId();
  if (groupId) {
    try {
      const sent = await ctx.telegram.sendMessage(groupId, groupText, { parse_mode: 'HTML' });
      ticketStore.linkGroupMessage(ctx.from.id, ticket.id, sent.message_id);
      delivered = true;

      if (ctx.message.photo?.length) {
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        const media = await ctx.telegram.sendPhoto(groupId, photo.file_id, {
          caption: `Обращение №${ticket.id}`,
          reply_to_message_id: sent.message_id,
        });
        ticketStore.linkGroupMessage(ctx.from.id, ticket.id, media.message_id);
      } else if (ctx.message.document) {
        const media = await ctx.telegram.sendDocument(groupId, ctx.message.document.file_id, {
          caption: `Обращение №${ticket.id}`,
          reply_to_message_id: sent.message_id,
        });
        ticketStore.linkGroupMessage(ctx.from.id, ticket.id, media.message_id);
      }
    } catch (err) {
      console.error('Web support forward error:', err.message || err);
    }
  }

  stateStore.set(ctx.from.id, {
    state: STATES.ACTIVE,
    activeTicketId: ticket.id,
    category: code,
  });

  const lines = [
    `✅ Обращение <b>№${ticket.id}</b> принято.`,
    '',
    `Категория: ${escapeHtml(label)}`,
  ];
  if (delivered) {
    lines.push('', 'Сотрудник поддержки ответит вам в этом чате.');
  } else {
    lines.push(
      '',
      '⚠️ Обращение сохранено, но группа поддержки недоступна.',
      'Администратору нужно добавить бота в группу веб-поддержки.'
    );
  }

  await ctx.reply(lines.join('\n'), {
    parse_mode: 'HTML',
    ...ticketKeyboard(ticket.id),
  });
}

export async function showTicketStatus(ctx, ticketId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  const ticket = deps.ticketStore.getTicket(ctx.from.id, ticketId);
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
    { parse_mode: 'HTML', ...ticketKeyboard(ticket.id) }
  );
}

export async function prepareAppend(ctx, ticketId, stateStore) {
  await ctx.answerCbQuery().catch(() => {});
  stateStore.set(ctx.from.id, {
    state: STATES.WAIT_MESSAGE,
    activeTicketId: Number(ticketId),
    category: 'other',
  });
  await ctx.reply('Отправьте дополнение к обращению (текст / фото / документ).', homeKeyboard());
}

export async function appendOrCreate(ctx, deps) {
  const state = deps.stateStore.get(ctx.from.id);
  if (state.activeTicketId && state.state === STATES.WAIT_MESSAGE) {
    const existing = deps.ticketStore.getTicket(ctx.from.id, state.activeTicketId);
    if (existing && !existing.closed) {
      const note = ctx.message.text || ctx.message.caption || '[медиа]';
      deps.ticketStore.appendTicketNote(ctx.from.id, existing.id, note);
      const groupId = deps.getGroupId();
      let delivered = false;
      if (groupId) {
        try {
          const sent = await ctx.telegram.sendMessage(
            groupId,
            [
              `➕ Дополнение к обращению <b>№${existing.id}</b>`,
              `<b>Telegram ID:</b> <code>${ctx.from.id}</code>`,
              '',
              escapeHtml(note),
            ].join('\n'),
            { parse_mode: 'HTML' }
          );
          deps.ticketStore.linkGroupMessage(ctx.from.id, existing.id, sent.message_id);
          delivered = true;
        } catch (err) {
          console.error('Web support append error:', err.message || err);
        }
      }
      deps.stateStore.set(ctx.from.id, {
        state: STATES.ACTIVE,
        activeTicketId: existing.id,
      });
      const text = delivered
        ? `✅ Дополнение к обращению №${existing.id} принято.`
        : `✅ Дополнение сохранено.\n⚠️ Группа поддержки недоступна.`;
      await ctx.reply(text, ticketKeyboard(existing.id));
      return;
    }
  }
  await receiveSupportMessage(ctx, deps);
}

export async function closeTicket(ctx, ticketId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  const ticket = deps.ticketStore.closeTicket(ctx.from.id, ticketId);
  if (!ticket) {
    await ctx.reply('Обращение не найдено.');
    return;
  }
  deps.stateStore.reset(ctx.from.id);
  await ctx.reply(`Обращение №${ticket.id} закрыто.`, homeKeyboard());
}
