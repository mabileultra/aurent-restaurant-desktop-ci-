export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatUser(from) {
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Пользователь';
  const username = from.username ? `@${from.username}` : 'без username';
  return { name, username, id: from.id };
}

export function isGroupChat(chat) {
  return chat?.type === 'group' || chat?.type === 'supergroup';
}
