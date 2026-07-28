const WELCOME = `Здравствуйте! 👋

Я бот Aurent.

<b>Что умею:</b>
• 💊 Напишите название или штрихкод лекарства — найду по магазинам (цена, остаток, адрес, телефон)
• 🆘 /support — связаться с поддержкой

Команды:
/find парацетамол — поиск лекарства
/support — режим поддержки`;

export async function handleStart(ctx) {
  if (ctx.chat?.type !== 'private') return;
  await ctx.reply(WELCOME, { parse_mode: 'HTML' });
}
