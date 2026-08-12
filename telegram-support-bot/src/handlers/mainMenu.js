import { mainMenuKeyboard } from '../keyboards/menus.js';
import { welcomeText, aboutText } from '../texts/messages.js';
import { STATES } from '../state/userStateStore.js';

export async function showMainMenu(ctx, stateStore) {
  stateStore.resetToMain(ctx.from.id);
  await ctx.reply(welcomeText(ctx.from.first_name), {
    parse_mode: 'HTML',
    ...mainMenuKeyboard(),
  });
}

export async function showAbout(ctx, stateStore) {
  stateStore.setState(ctx.from.id, STATES.ABOUT);
  await ctx.reply(aboutText(), {
    parse_mode: 'HTML',
    ...mainMenuKeyboard(),
  });
}
