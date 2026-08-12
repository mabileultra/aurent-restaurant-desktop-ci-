import {
  homeKeyboard,
  barcodeFailButtons,
  errorButtons,
} from '../keyboards/menus.js';
import {
  barcodePromptText,
  barcodeFailText,
  genericErrorText,
} from '../texts/messages.js';
import { STATES } from '../state/userStateStore.js';
import { runMedicineSearch } from './searchFlow.js';

export async function promptBarcode(ctx, stateStore) {
  stateStore.setState(ctx.from.id, STATES.BARCODE_WAITING);
  await ctx.reply(barcodePromptText(), {
    parse_mode: 'HTML',
    ...homeKeyboard(),
  });
}

function extractBarcode(text) {
  if (!text) return null;
  const digits = String(text).replace(/\D/g, '');
  if (digits.length >= 8 && digits.length <= 14) return digits;
  return null;
}

export async function handleBarcodeInput(ctx, deps) {
  const text = ctx.message.text || ctx.message.caption || '';
  const code = extractBarcode(text);

  if (ctx.message.photo?.length && !code) {
    // OCR пока нет — честный UX по ТЗ
    await ctx.reply(barcodeFailText(), barcodeFailButtons());
    return;
  }

  if (!code) {
    await ctx.reply(barcodeFailText(), barcodeFailButtons());
    return;
  }

  deps.stateStore.setState(ctx.from.id, STATES.BARCODE_RESULT);
  await runMedicineSearch(ctx, code, deps);
}

export async function handleBarcodeError(ctx) {
  await ctx.reply(genericErrorText(), errorButtons('nav:barcode'));
}
