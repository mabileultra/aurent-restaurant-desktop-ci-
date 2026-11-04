import fs from 'fs';
import path from 'path';

/**
 * Хранит ID группы поддержки для одного инстанса бота (файл в dataDir).
 */
export function createSupportGroupStore(initialGroupId, dataDir) {
  let activeGroupId = initialGroupId || null;
  const filePath = dataDir ? path.join(dataDir, 'support-group-id.txt') : null;

  if (!activeGroupId && filePath && fs.existsSync(filePath)) {
    const saved = fs.readFileSync(filePath, 'utf8').trim();
    if (saved) activeGroupId = saved;
  }

  function persistGroupId(id) {
    if (!filePath) return;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${id}\n`);
  }

  return {
    getId: () => activeGroupId,
    connectGroup(chat) {
      const id = String(chat.id);
      if (activeGroupId === id) return;
      activeGroupId = id;
      persistGroupId(id);
      console.log(`\n✅ Группа поддержки подключена: «${chat.title || 'без названия'}» → ${id}\n`);
    },
  };
}
