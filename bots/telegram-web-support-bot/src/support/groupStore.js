import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const botDir = path.join(__dirname, '..');
const rootEnvPath = path.join(botDir, '..', '.env');
const botEnvPath = path.join(botDir, '.env');
const ENV_KEY = 'TELEGRAM_WEB_SUPPORT_GROUP_ID';

export function createGroupStore(initialGroupId) {
  let activeGroupId = initialGroupId || null;

  function persistGroupId(id) {
    const line = `${ENV_KEY}=${id}`;
    for (const file of [botEnvPath, rootEnvPath]) {
      if (!fs.existsSync(file)) continue;
      let content = fs.readFileSync(file, 'utf8');
      if (new RegExp(`${ENV_KEY}=`).test(content)) {
        content = content.replace(new RegExp(`${ENV_KEY}=.*`, 'm'), line);
      } else {
        content = `${content.trimEnd()}\n${line}\n`;
      }
      fs.writeFileSync(file, content);
    }
  }

  return {
    getId: () => activeGroupId,
    connectGroup(chat) {
      const id = String(chat.id);
      if (activeGroupId === id) return;
      activeGroupId = id;
      persistGroupId(id);
      console.log(`\n✅ Группа веб-поддержки подключена: «${chat.title || 'без названия'}» → ${id}\n`);
    },
  };
}
