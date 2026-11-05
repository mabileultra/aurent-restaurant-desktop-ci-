/**
 * Кириллица → латиница для термопринтеров / MK Fiscal (иначе Xprinter в китайском режиме даёт иероглифы).
 */

const CYR_MAP = {
  А: 'A',
  Б: 'B',
  В: 'V',
  Г: 'G',
  Д: 'D',
  Е: 'E',
  Ё: 'Yo',
  Ж: 'Zh',
  З: 'Z',
  И: 'I',
  Й: 'Y',
  К: 'K',
  Л: 'L',
  М: 'M',
  Н: 'N',
  О: 'O',
  П: 'P',
  Р: 'R',
  С: 'S',
  Т: 'T',
  У: 'U',
  Ф: 'F',
  Х: 'Kh',
  Ц: 'Ts',
  Ч: 'Ch',
  Ш: 'Sh',
  Щ: 'Sch',
  Ъ: '',
  Ы: 'Y',
  Ь: '',
  Э: 'E',
  Ю: 'Yu',
  Я: 'Ya',
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  Ў: "O'",
  ў: "o'",
  Қ: 'Q',
  қ: 'q',
  Ғ: "G'",
  ғ: "g'",
  Ҳ: 'H',
  ҳ: 'h',
};

const HAS_CYRILLIC = /[\u0400-\u04FF]/;

export function hasCyrillic(text) {
  return HAS_CYRILLIC.test(String(text || ''));
}

/** Если в строке есть кириллица — транслит в латиницу; иначе без изменений. */
export function transliterateCyrillicToLatin(text) {
  const raw = String(text ?? '');
  if (!raw || !hasCyrillic(raw)) return raw;
  let out = '';
  for (const ch of raw) {
    out += Object.prototype.hasOwnProperty.call(CYR_MAP, ch) ? CYR_MAP[ch] : ch;
  }
  return out;
}
