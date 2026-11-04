import { escapeHtml, formatUser } from '../utils/telegramText.js';

export function createSupportForwarder({ telegram, getGroupId }) {
  return async function forwardToGroup(ctx, content) {
    const activeGroupId = getGroupId();
    if (!activeGroupId) {
      console.log('Обращение без группы:', ctx.from?.id, content.slice(0, 120));
      return false;
    }

    const { name, username, id } = formatUser(ctx.from);
    const text = [
      '📩 <b>Новое обращение</b>',
      '',
      `<b>От:</b> ${escapeHtml(name)} (${escapeHtml(username)})`,
      `<b>Telegram ID:</b> <code>${id}</code>`,
      '',
      '<b>Сообщение:</b>',
      escapeHtml(content),
    ].join('\n');

    await telegram.sendMessage(activeGroupId, text, { parse_mode: 'HTML' });
    return true;
  };
}
