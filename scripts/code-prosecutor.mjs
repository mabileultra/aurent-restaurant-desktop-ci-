#!/usr/bin/env node

/**
 * Aurent POS — Code Prosecutor (Sud Qoralovchisi) CLI Runner Engine
 * 
 * Ushbu vosita kod o'zgarishlarini (git diff va untracked fayllarni) statik tahlil qilib,
 * 8 ta Ayblov Moddasi bo'yicha qat'iy sud aybnomasi (Prosecutor Indictment) chiqaradi.
 * 
 * Chiqish:
 *  - Exit code 0: Barcha fayllar toza (🟢 OQLANDI) yoki --help
 *  - Exit code 1: Qoidabuzarliklar aniqlandi (🔴 AYBDOR)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync, execFileSync } from 'node:child_process';

const MAX_SRP_LINES = 200;

// ANSI ranglar
const COLOR = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m\x1b[37m\x1b[1m',
  bgGreen: '\x1b[42m\x1b[30m\x1b[1m',
};

/**
 * CLI argumentlarini tahlil qilish
 */
export function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    watch: false,
    staged: false,
    all: false,
    json: false,
    help: false,
    installHook: false,
    files: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--watch') {
      options.watch = true;
    } else if (arg === '--staged') {
      options.staged = true;
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--install-hook') {
      options.installHook = true;
    } else if (arg === '--files') {
      while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        options.files.push(argv[++i]);
      }
    } else if (!arg.startsWith('--')) {
      options.files.push(arg);
    }
  }

  return options;
}

/**
 * Papka yoki fayl yo'llarini xavfsiz kengaytirish (directory bo'lsa ichidagi fayllarni olish)
 */
export function expandFilePaths(filePaths, cwd = process.cwd()) {
  const result = [];
  const visitedDirs = new Set();

  function scanDir(dirPath) {
    if (visitedDirs.has(dirPath)) return;
    visitedDirs.add(dirPath);

    let entries = [];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name === '.agents' ||
        entry.name === 'tests' ||
        entry.name === 'scripts'
      ) {
        continue;
      }
      const fullEntryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullEntryPath);
      } else if (entry.isFile()) {
        if (
          /\.(jsx?|tsx?|vue|html|css|json)$/i.test(entry.name) &&
          !entry.name.includes('.test.') &&
          !entry.name.includes('.spec.')
        ) {
          const relPath = path.relative(cwd, fullEntryPath);
          result.push(relPath);
        }
      }
    }
  }

  for (const rawPath of filePaths) {
    const cleanPath = rawPath.replace(/^"|"$/g, '');
    const fullPath = path.isAbsolute(cleanPath) ? cleanPath : path.resolve(cwd, cleanPath);
    if (!fs.existsSync(fullPath)) {
      continue;
    }
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (stat.isFile()) {
        result.push(cleanPath);
      }
    } catch {}
  }

  return result;
}

/**
 * Git working tree orqali o'zgargan fayllarni aniqlash
 */
export function getChangedFilesFromGit(options = {}, cwd = process.cwd()) {
  try {
    if (options.staged) {
      const output = execSync('git diff --cached --name-only', { cwd, encoding: 'utf8' }).trim();
      if (!output) return [];
      return output
        .split('\n')
        .map(f => f.trim().replace(/^"|"$/g, ''))
        .filter(f => (
          Boolean(f) &&
          !f.startsWith('tests/') &&
          !f.startsWith('scripts/') &&
          !f.startsWith('.agents/') &&
          !/\.(test|spec)\.[jt]sx?$/i.test(f) &&
          !/\.(md|markdown|txt|ya?ml|svg|png|jpg|jpeg|gif|json)$/i.test(f) &&
          (/\.(jsx?|tsx?|vue|html|css)$/i.test(f) || f.includes('backend') || f.includes('-service'))
        ));
    }

    if (options.all) {
      // Monorepodagi barcha frontend/package kod fayllarini tez va filtrlangan holda olish
      const output = execSync('git ls-files "apps/**" "packages/**"', { cwd, encoding: 'utf8' }).trim();
      if (!output) return [];
      return output
        .split('\n')
        .map(f => f.trim().replace(/^"|"$/g, ''))
        .filter(f => (
          Boolean(f) &&
          /\.(jsx?|tsx?|vue)$/i.test(f) &&
          !f.startsWith('tests/') &&
          !/\.(test|spec)\.[jt]sx?$/i.test(f)
        ));
    }

    // Default: working tree (staged, modified va untracked)
    const statusOut = execSync('git status --porcelain -uall', { cwd, encoding: 'utf8' }).trim();
    if (!statusOut) return [];

    const files = [];
    const lines = statusOut.split('\n');
    for (const line of lines) {
      if (!line) continue;
      let filePath = line.substring(3).trim();

      // Git rename holati (R  old.jsx -> new.jsx yoki RM old.jsx -> new.jsx)
      if (filePath.includes(' -> ')) {
        filePath = filePath.split(' -> ')[1].trim();
      }

      // Probel yoki maxsus belgili fayllarning git qo'shtirnoqlarini tozalash
      filePath = filePath.replace(/^"|"$/g, '');

      // Test fayllari va test to'plamlarini avtomatik working tree auditidan chiqarib tashlaymiz
      if (filePath.startsWith('tests/') || /\.test\.[jt]sx?$/.test(filePath) || /\.spec\.[jt]sx?$/.test(filePath)) {
        continue;
      }
      if (/\.(jsx?|tsx?|vue|html|css|json)$/i.test(filePath) || filePath.includes('backend') || filePath.includes('-service')) {
        files.push(filePath);
      }
    }
    return files;
  } catch {
    return [];
  }
}

/**
 * Fayl diffini xavfsiz olish (Command Injection dan himoyalangan execFileSync yordamida)
 */
export function getFileDiff(filePath, cwd = process.cwd()) {
  try {
    const diff = execFileSync('git', ['diff', 'HEAD', '--', filePath], {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    if (diff) return diff;
  } catch {}

  try {
    const diff = execFileSync('git', ['diff', '--no-index', '/dev/null', filePath], {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    if (diff) return diff;
  } catch (err) {
    if (err && err.stdout) return err.stdout.toString();
  }

  return '';
}

/**
 * Koddan izohlarni tozalab, qatorlar strukturasini saqlash
 */
export function sanitizeLines(lines) {
  let inBlockComment = false;
  return lines.map((line) => {
    let text = line;

    if (inBlockComment) {
      const closeIdx = text.indexOf('*/');
      if (closeIdx !== -1) {
        text = text.substring(closeIdx + 2);
        inBlockComment = false;
      } else {
        return '';
      }
    }

    // Bir qatordagi blok izohlar /* ... */
    while (text.includes('/*')) {
      const startIdx = text.indexOf('/*');
      const endIdx = text.indexOf('*/', startIdx + 2);
      if (endIdx !== -1) {
        text = text.substring(0, startIdx) + text.substring(endIdx + 2);
      } else {
        text = text.substring(0, startIdx);
        inBlockComment = true;
        break;
      }
    }

    // Qatorli izoh //
    const lineCommentIdx = text.indexOf('//');
    if (lineCommentIdx !== -1) {
      text = text.substring(0, lineCommentIdx);
    }

    // JSX izohlar: {/* ... */}
    text = text.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');

    return text.trimEnd();
  });
}

/**
 * Faylni o'qib, uning metrikalarini va qatorlarini xavfsiz tahlil qilish
 */
export function loadFileInfo(filePath, cwd = process.cwd()) {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(cwd, filePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  try {
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) {
      return null;
    }
  } catch {
    return null;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  const sanitized = sanitizeLines(lines);
  const totalLines = lines.length;

  return {
    filePath,
    fullPath,
    content,
    lines,
    sanitized,
    totalLines,
    diff: '',
  };
}

/**
 * Modda 4: Xom <input type="date"> ni aniqlash (bir yoki ko'p qatorli)
 * PlatformDatePicker kabi toza komponentlar oqlanadi.
 */
export function isRawDateInput(sanitizedLines, index) {
  const code = sanitizedLines[index];
  if (!code) return false;

  // Bir qatorda: <input ... type="date"
  if (/<input\b[^>]*type=["']date["']/i.test(code)) {
    return true;
  }

  // Ko'p qatorda: type="date" mavjud bo'lsa, ochuvchi tegni tekshiramiz
  if (/type=["']date["']/i.test(code)) {
    if (/PlatformDatePicker|BaseDatePicker|DateRangePicker/i.test(code)) {
      return false;
    }

    for (let j = index; j >= 0 && j >= index - 6; j--) {
      const prevLine = sanitizedLines[j];
      if (/<input\b/i.test(prevLine)) {
        return true;
      }
      if (/PlatformDatePicker|BaseDatePicker|DateRangePicker/i.test(prevLine)) {
        return false;
      }
      if (j !== index && />/.test(prevLine) && !/<input\b/i.test(prevLine)) {
        break;
      }
    }
  }

  return false;
}

/**
 * Modda 6: Sehrli sonlarni umumiy va xolis tekshirish
 * Ruxsat etilgan sonlar: 0, 1, -1, 100 (foiz), 200, 400, 401, 403, 404, 500 (HTTP kodlar).
 * Konstantalar (const UPPER_CASE = ...) taqiqlanmaydi.
 */
export function isMagicNumberViolation(code) {
  // Konstantalarni e'lon qilish ruxsat etiladi: const MAX_HOURS = 720;
  if (/^\s*(?:export\s+)?const\s+[A-Z][A-Z0-9_]*\s*=/.test(code)) {
    return false;
  }

  // Satrlar (string literals, Tailwind className lar) ichidagi raqamlarni hisobga olmaslik
  const stripped = code
    .replace(/(["`])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g, '')
    .replace(/'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*'/g, '');

  // O'nlik kasrlar bilan hisob-kitob (masalan total * 0.12 yoki price * 0.25)
  if (/[\*\+\-\/]\s*0\.\d+/.test(stripped)) {
    return true;
  }

  // Status, bosqich yoki turni to'g'ridan-to'g'ri raqam bilan taqqoslash (masalan status === 3, state === 2)
  if (/\b(?:status|state|step|stage|role)\s*===?\s*[0-9]+/i.test(stripped)) {
    return true;
  }

  // Shartlardagi kontekstsiz sonlar bilan taqqoslash (> 250, > 500000, === 42)
  const compMatches = stripped.matchAll(/(?:[><!=]=?)\s*([0-9]+(?:\.[0-9]+)?)/g);
  const allowed = new Set(['0', '1', '100', '200', '400', '401', '403', '404', '500']);
  for (const match of compMatches) {
    const num = match[1];
    if (!allowed.has(num)) {
      return true;
    }
  }

  // Hisob-kitoblarda ruxsat etilmagan sonlarga ko'paytirish yoki bo'lish (total * 25, val / 15)
  const arithMatches = stripped.matchAll(/(?:[\*\/])\s*([0-9]+(?:\.[0-9]+)?)/g);
  for (const match of arithMatches) {
    const num = match[1];
    if (!allowed.has(num)) {
      return true;
    }
  }

  return false;
}

/**
 * Qoidalar Tekshiruvi (The 8 Articles of Indictment)
 */
export function auditFile(fileInfo) {
  const violations = [];
  const { filePath, lines, sanitized, totalLines } = fileInfo;

  // 🚨 Modda 1: Ruxsatsiz Doiraga Tajovuz (Backend Chegarasi)
  if (/(?:^|\/)(?:backend|web-backend|pharmacy-service|restaurant-service|platform-service)\//.test(filePath)) {
    violations.push({
      article: 'Modda 1: Ruxsatsiz Doiraga Tajovuz (Backend Chegarasi)',
      severity: 'KRITIK',
      filePath,
      line: 1,
      verbatim: `Fayl yo'li: ${filePath}`,
      reason: 'Frontend topshiriqlarida backend kataloglaridagi fayllarga tegish qat\'iyan taqiqlanadi.',
      remediation: 'O\'zgarishlarni darhol bekor qiling va faqat backend dasturchisi uchun Texnik Topshiriq (TZ) yozing.',
    });
  }

  // 🚨 Modda 2: Og'ir Backend Mantiqini Noqonuniy O'zlashtirish
  const heavyBackendRegex = /(?:classif(?:y|ier)|tasnif|ikpu.*regex|regex.*classify|categorizeProductsClientSide|heavyClientProcessing)/i;
  for (let i = 0; i < sanitized.length; i++) {
    const code = sanitized[i];
    if (!code) continue;
    if (heavyBackendRegex.test(code) && (code.includes('RegExp') || code.includes('.test(') || code.includes('.match(') || code.includes('catalog') || code.includes('products'))) {
      violations.push({
        article: "Modda 2: Og'ir Backend Mantiqini Noqonuniy O'zlashtirish",
        severity: 'KRITIK',
        filePath,
        line: i + 1,
        verbatim: lines[i].trim(),
        reason: 'Frontendda og\'ir tasniflash, regex orqali mahsulotlarni klassifikatsiya qilish yoki biznes mantiqni taxmin qilish brauzerni qotiradi va kassa tezligini pasaytiradi.',
        remediation: 'Og\'ir tasniflash mantiqini frontenddan butunlay olib tashlang. Ushbu operatsiya backend API da amalga oshirilishi shart.',
      });
      break;
    }
  }

  // 🚨 Modda 3: Monolit Chegarasi va SRP Qoidabuzarligi (>200 Qator)
  // Faqat skript va komponent fayllariga (.js, .jsx, .ts, .tsx, .vue) qo'llanadi.
  // Ma'lumot va uslub fayllari (.json, .css, .svg, .md) bu ayblovdan mustasno.
  if (/\.(jsx?|tsx?|vue)$/i.test(filePath) && totalLines > MAX_SRP_LINES) {
    violations.push({
      article: 'Modda 3: Monolit Chegarasi va SRP Qoidabuzarligi (>200 Qator)',
      severity: 'YUQORI',
      filePath,
      line: totalLines,
      verbatim: `Jami qatorlar soni: ${totalLines} (Limit: ${MAX_SRP_LINES})`,
      reason: `Fayl hajmi ${totalLines} qatordan iborat. Qoidaga ko'ra, 200 qatordan oshgan faylga to'g'ridan-to'g'ri yangi kod qo'shish qat'iyan man etiladi.`,
      remediation: 'Pre-flight refaktoring o\'tkazing: faylni kichik subkomponentlar, maxsus hooklar (`hooks/`) yoki yordamchilarga (`utils/`) ajrating.',
    });
  }

  // 🚨 Modda 4: DRY va Yagona Standartlarni Mensimaslik (Xom HTML)
  for (let i = 0; i < sanitized.length; i++) {
    const code = sanitized[i];
    if (!code) continue;

    // Xom <select>
    if (/<select\b/.test(code)) {
      violations.push({
        article: 'Modda 4: DRY va Yagona Standartlarni Mensimaslik (Xom HTML)',
        severity: "O'RTA",
        filePath,
        line: i + 1,
        verbatim: lines[i].trim(),
        reason: 'Standart xom <select> tegi ishlatilgan. Loyihada yagona PlatformSelect yoki BaseSelect mavjud.',
        remediation: "Xom <select> o'rniga `PlatformSelect` yoki `BaseSelect` komponentidan foydalaning.",
      });
    }

    // Faqat xom <input type="date"> (PlatformDatePicker kabi toza komponentlar oqlanadi)
    if (isRawDateInput(sanitized, i)) {
      violations.push({
        article: 'Modda 4: DRY va Yagona Standartlarni Mensimaslik (Xom HTML)',
        severity: "O'RTA",
        filePath,
        line: i + 1,
        verbatim: lines[i].trim(),
        reason: 'Standart xom <input type="date"> ishlatilgan. Loyihada yagona PlatformDatePicker mavjud.',
        remediation: "Xom date input o'rniga `PlatformDatePicker` yoki `PlatformDateRangePicker` komponentidan foydalaning.",
      });
    }

    // Takroriy lokal sana formatlash funksiyasi (umumiy regex)
    if (/(?:function|const|let)\s+(?:format[A-Z]\w*Date\w*|get[A-Z]\w*Date\w*|dateTo[A-Z]\w*|formatDate)\b/i.test(code)) {
      violations.push({
        article: 'Modda 4: DRY va Yagona Standartlarni Mensimaslik (Xom HTML)',
        severity: "O'RTA",
        filePath,
        line: i + 1,
        verbatim: lines[i].trim(),
        reason: 'Sana formatlash uchun alohida lokal funksiya yozilgan. Loyihada umumiy `formatAdminDateTime` utiliti mavjud.',
        remediation: 'Lokal sana formatlash funksiyasini o\'chirib, `utils/formatAdminDateTime` dan import qiling.',
      });
    }
  }

  // 🚨 Modda 5: Unumdorlikka Qasddan Zarar Yetkazish & Xotira Sizishi (Memory Leak)
  for (let i = 0; i < sanitized.length; i++) {
    const code = sanitized[i];
    if (!code) continue;

    // Full-table yuklash
    if (/(?:listAll|getAll|fetchAll)\s*\(/.test(code) && !lines[i].includes('prosecutor-ignore')) {
      const isPaginated = /(?:page|size|limit|offset|pageSize|params)/i.test(code);
      if (!isPaginated) {
        violations.push({
          article: 'Modda 5: Unumdorlikka Qasddan Zarar Yetkazish (Full-Table)',
          severity: 'YUQORI',
          filePath,
          line: i + 1,
          verbatim: lines[i].trim(),
          reason: 'Butun bazani yuklovchi `getAll` / `listAll` so\'rovi ishlatilgan. Bu katta hajmdagi ma\'lumotlarda xotirani to\'ldiradi.',
          remediation: 'Server-side paginatsiyadan foydalaning (masalan `totalElements` yoki `size: 1` / `/stats` endpointi).',
        });
      }
    }
  }

  // useEffect ichida cleanupsiz listener/interval
  const sanitizedContent = sanitized.join('\n');
  if (sanitizedContent.includes('useEffect(')) {
    const hasEventListener = /addEventListener\s*\(/.test(sanitizedContent);
    const hasInterval = /setInterval\s*\(/.test(sanitizedContent);
    const hasCleanup =
      /return\s*\(\)\s*=>/.test(sanitizedContent) ||
      /return\s+function/.test(sanitizedContent) ||
      /removeEventListener/.test(sanitizedContent) ||
      /clearInterval/.test(sanitizedContent);

    if ((hasEventListener || hasInterval) && !hasCleanup) {
      let targetLine = 1;
      for (let i = 0; i < sanitized.length; i++) {
        if (sanitized[i].includes('addEventListener') || sanitized[i].includes('setInterval')) {
          targetLine = i + 1;
          break;
        }
      }
      violations.push({
        article: 'Modda 5: Xotira Sizishi (Memory Leak — useEffect Cleanupsiz)',
        severity: 'KRITIK',
        filePath,
        line: targetLine,
        verbatim: lines[targetLine - 1]?.trim() || 'useEffect(() => { ... })',
        reason: '`useEffect` ichida event listener yoki interval o\'rnatilgan, biroq tozalash (`cleanup`) funksiyasi qaytarilmagan. Bu xotira sizib ketishiga (memory leak) olib keladi.',
        remediation: '`useEffect` oxirida tozalash funksiyasini qaytaring: `return () => window.removeEventListener(...)` yoki `clearInterval(...)`.',
      });
    }
  }

  // 🚨 Modda 6: Kod Ifloslanishi va Yashirin Xatolar (Clean Code)
  for (let i = 0; i < sanitized.length; i++) {
    const code = sanitized[i];
    if (!code) continue;

    // console.log
    if (/console\.log\s*\(/.test(code)) {
      violations.push({
        article: 'Modda 6: Kod Ifloslanishi (Clean Code — console.log)',
        severity: 'PAST',
        filePath,
        line: i + 1,
        verbatim: lines[i].trim(),
        reason: 'Ishlab chiqarish (production) kodida `console.log` qoldirilgan.',
        remediation: '`console.log` chaqiruvini butunlay o\'chirib tashlang.',
      });
    }

    // Noaniq nomlash
    if (/(?:const|let|var)\s+(?:a|temp|data2|val|cb|obj)\s*=/i.test(code)) {
      violations.push({
        article: 'Modda 6: Kod Ifloslanishi (Clean Code — Noaniq Nomlash)',
        severity: "O'RTA",
        filePath,
        line: i + 1,
        verbatim: lines[i].trim(),
        reason: 'O\'zgaruvchiga tushunarsiz va dangasa nom berilgan (`a`, `temp`, `data2`, `val`, `cb`).',
        remediation: 'O\'zgaruvchiga uning maqsadini ifodalovchi aniq nom bering (masalan `productDiscountRate`, `currentCartItem`).',
      });
    }

    // Sehrli sonlar (umumiy tekshiruv)
    if (isMagicNumberViolation(code)) {
      violations.push({
        article: 'Modda 6: Kod Ifloslanishi (Clean Code — Sehrli Sonlar)',
        severity: "O'RTA",
        filePath,
        line: i + 1,
        verbatim: lines[i].trim(),
        reason: 'Kodda kontekstsiz sehrli sonlar ishlatilgan. Bu mantiqni tushunishni qiyinlashtiradi.',
        remediation: 'Sehrli sonlarni tushunarli konstantalarga ajrating (masalan `const HIGH_VALUE_THRESHOLD = 500000; const DEFAULT_TAX_RATE = 0.12`).',
      });
    }
  }

  // 🚨 Modda 7: Sensor Ergonomika va Rang Shovqini Buzilishi (UI/UX)
  for (let i = 0; i < sanitized.length; i++) {
    const code = sanitized[i];
    if (!code) continue;

    // Tap target < 44px
    if (
      /\b(h-6|h-7|h-8|min-h-\[24px\]|min-h-\[32px\])\b/.test(code) &&
      (code.includes('button') ||
        code.includes('btn') ||
        code.includes('onClick') ||
        code.includes('px-') ||
        (i > 0 && lines[i - 1].includes('<button')) ||
        (i + 1 < lines.length && lines[i + 1].includes('</button')))
    ) {
      violations.push({
        article: 'Modda 7: Sensor Ergonomika Buzilishi (Tap target < 44px)',
        severity: 'YUQORI',
        filePath,
        line: i + 1,
        verbatim: lines[i].trim(),
        reason: 'Sensorli POS ekranlari uchun bosish nishoni (tap target) 44x44px dan kichik qilib belgilangan.',
        remediation: 'Tugmaga kamida `min-h-[44px]` (yoki `min-h-[48px]`, `h-11`, `h-12`) o\'lcham bering.',
      });
    }

    // Rang shovqini
    if (
      /(?:type|category|storeType|retail).*(?:bg-amber|text-amber|bg-yellow|text-yellow|bg-rose|text-rose|bg-red|text-red)/i.test(code) &&
      !code.toLowerCase().includes('warning') &&
      !code.toLowerCase().includes('error') &&
      !code.toLowerCase().includes('danger')
    ) {
      violations.push({
        article: 'Modda 7: Semantik Rang Shovqini (Color Noise)',
        severity: "O'RTA",
        filePath,
        line: i + 1,
        verbatim: lines[i].trim(),
        reason: 'Neytral ma\'lumotlar (do\'kon turi, mahsulot kategoriyasi) uchun sariq yoki qizil rang berilgan. Sariq — faqat xavf/warning, qizil — faqat xato uchun!',
        remediation: 'Neytral ma\'lumotlar uchun `slate` (kulrang) yoki brend rangidan (`emerald`) foydalaning.',
      });
    }
  }

  // 🚨 Modda 8: Xavfsiz Git Tartibiga Tajovuz
  if (/git\s+(?:add|commit|push)/.test(sanitizedContent) && !filePath.includes('code-prosecutor') && !filePath.includes('.test.js')) {
    violations.push({
      article: 'Modda 8: Xavfsiz Git Tartibiga Tajovuz',
      severity: 'KRITIK',
      filePath,
      line: 1,
      verbatim: 'Kodda avtomatlashtirilgan git add/commit/push aniqlandi',
      reason: 'Foydalanuvchining to\'g\'ridan-to\'g\'ri ruxsatisiz git buyruqlarini skriptlarda bajarish qat\'iyan taqiqlanadi.',
      remediation: 'Git avtomatlashtirish kodini olib tashlang.',
    });
  }

  return violations;
}

/**
 * Rasmiy Sud Qoralovi hisobotini formatlash (Markdown formati)
 */
export function formatIndictmentReport(allViolations, checkedFiles) {
  const timestamp = new Date().toISOString();
  const isGuilty = allViolations.length > 0;
  const verdict = isGuilty ? '🔴 AYBDOR (KOD RAD ETILADI)' : '🟢 OQLANDI (KOD QABUL QILINADI)';

  let report = '';
  report += `# ⚖️ SUD QORALOVI (PROSECUTOR INDICTMENT)\n`;
  report += `**Ish raqami**: INDICTMENT-${Date.now()}\n`;
  report += `**Sana**: ${timestamp}\n`;
  report += `**Tekshirilgan fayllar soni**: ${checkedFiles.length}\n`;
  report += `**Qoralovchi**: Aurent POS Adversarial Code Prosecutor\n`;
  report += `**Yakuniy Hukm**: ${verdict}\n\n`;
  report += `---\n\n`;

  if (!isGuilty) {
    report += `## 🟢 SUD TERGOVI XULOSASI\n\n`;
    report += `Tekshirilgan barcha fayllar Aurent POS Kodeksiga (Clean Code, DRY, SRP <200, Unumdorlik va UI/UX) 100% javob beradi.\n`;
    report += `Hech qanday qoidabuzarlik yoki yashirin nuqsonlar aniqlanmadi. Kod ishlab chiqarishga ruxsat etiladi.\n`;
    return report;
  }

  report += `## 📜 AYBLOV MODDALARI (${allViolations.length} ta jinoyat aniqlandi)\n\n`;

  allViolations.forEach((v, index) => {
    report += `### 🚨 Ayblov Moddasi ${index + 1}: ${v.article}\n`;
    report += `- **Jinoyat joyi**: \`${v.filePath}:${v.line}\`\n`;
    report += `- **Xavf darajasi**: \`${v.severity}\`\n`;
    report += `- **Ashyoviy dalil (Verbatim kod)**:\n`;
    report += `  \`\`\`javascript\n`;
    report += `  ${v.verbatim}\n`;
    report += `  \`\`\`\n`;
    report += `- **Ayblov asosi va Yetkazilgan xavf**:\n  ${v.reason}\n`;
    report += `- **Qat'iy Hukm (Majburiy tuzatish ko'rsatmasi)**:\n  ${v.remediation}\n\n`;
  });

  report += `---\n\n`;
  report += `## ⚖️ YAKUNIY HUKM (FINAL VERDICT)\n`;
  report += `🔴 **KOD RAD ETILDI**: Yuqorida ko'rsatilgan barcha qoidabuzarliklar bartaraf etilmaguncha kod qabul qilinmaydi va merj taqiqlanadi.\n`;

  return report;
}

/**
 * Terminalga rangli konsol xabarini chiqarish
 */
export function printConsoleIndictment(allViolations, checkedFiles) {
  const isGuilty = allViolations.length > 0;

  console.log(`\n${COLOR.bold}${COLOR.cyan}======================================================================${COLOR.reset}`);
  console.log(`${COLOR.bold}${COLOR.yellow}⚖️  AURENT POS — SUD QORALOVI (PROSECUTOR INDICTMENT)${COLOR.reset}`);
  console.log(`${COLOR.bold}${COLOR.cyan}======================================================================${COLOR.reset}`);
  console.log(`${COLOR.gray}Tekshirilgan fayllar:${COLOR.reset} ${checkedFiles.length} ta`);

  if (!isGuilty) {
    console.log(`\n${COLOR.bgGreen} 🟢 HUKM: OQLANDI (CLEAN) ${COLOR.reset}`);
    console.log(`${COLOR.green}Barcha fayllar Aurent POS Kodeksiga to'liq javob beradi. Qoidabuzarlik aniqlanmadi.${COLOR.reset}\n`);
    return;
  }

  console.log(`\n${COLOR.bgRed} 🔴 HUKM: AYBDOR (${allViolations.length} TA QOIDABUZARLIK ANIQLANDI) ${COLOR.reset}\n`);

  allViolations.forEach((v, index) => {
    console.log(`${COLOR.bold}${COLOR.red}[AYBLOV #${index + 1}] ${v.article}${COLOR.reset}`);
    console.log(`  ${COLOR.gray}Manzil:${COLOR.reset}      ${COLOR.cyan}${v.filePath}:${v.line}${COLOR.reset}  (${COLOR.yellow}${v.severity}${COLOR.reset})`);
    console.log(`  ${COLOR.gray}Dalil:${COLOR.reset}       ${COLOR.dim}${v.verbatim}${COLOR.reset}`);
    console.log(`  ${COLOR.gray}Asos:${COLOR.reset}        ${v.reason}`);
    console.log(`  ${COLOR.gray}Ko'rsatma:${COLOR.reset}   ${COLOR.green}${v.remediation}${COLOR.reset}\n`);
  });

  console.log(`${COLOR.bold}${COLOR.red}❌ KOD MERJ QILINISHI TAQIQLANADI! Yuqoridagi barcha ayblovlarni tuzating.${COLOR.reset}\n`);
}

/**
 * CLI yordam matnini chiqarish
 */
export function printHelp() {
  console.log(`
${COLOR.bold}${COLOR.cyan}======================================================================${COLOR.reset}
${COLOR.bold}${COLOR.yellow}⚖️  AURENT POS — CODE PROSECUTOR (SUD QORALOVCHISI) CLI${COLOR.reset}
${COLOR.bold}${COLOR.cyan}======================================================================${COLOR.reset}

Murosasiz kod tekshiruvi va Aurent POS Kodeksining 8 ta Ayblov Moddasi
bo'yicha qat'iy sud tergovi o'tkazuvchi auditor vosita.

${COLOR.bold}FOYDALANISH:${COLOR.reset}
  node scripts/code-prosecutor.mjs [FLAGLAR]
  pnpm prosecute [FLAGLAR]

${COLOR.bold}FLAGLAR:${COLOR.reset}
  -h, --help            Ushbu yordam matnini chiqarish va chiqish (exit code 0)
  --staged              Faqat git staged (indeksga qo'shilgan) fayllarni tekshirish
  --all                 Barcha frontend kod fayllarini (apps/ va packages/) to'liq skanerlash
  --files <yo'llar...>  Maxsus ko'rsatilgan fayllar yoki papkalarni tekshirish
  --watch               Fayllar o'zgarishini real vaqt rejimida kuzatib borish
  --json                Natijalarni toza JSON formatida chiqarish (CI/CD va subagentlar uchun)
  --install-hook        Git pre-commit hookini o'rnatish

${COLOR.bold}AYBLOV MODDALARI (8 TA MODDA):${COLOR.reset}
  1. Modda 1: Ruxsatsiz Doiraga Tajovuz (Backend Chegarasi)
  2. Modda 2: Og'ir Backend Mantiqini Noqonuniy O'zlashtirish
  3. Modda 3: Monolit Chegarasi va SRP Qoidabuzarligi (>200 Qator)
  4. Modda 4: DRY va Yagona Standartlarni Mensimaslik (Xom HTML / Sana formatlari)
  5. Modda 5: Unumdorlikka Qasddan Zarar Yetkazish & Memory Leak
  6. Modda 6: Kod Ifloslanishi va Yashirin Xatolar (Clean Code)
  7. Modda 7: Sensor Ergonomika va Rang Shovqini Buzilishi (UI/UX)
  8. Modda 8: Xavfsiz Git Tartibiga Tajovuz
`);
}

/**
 * Git Pre-commit hook o'rnatish
 */
export function installGitHook(cwd = process.cwd()) {
  const hookDir = path.resolve(cwd, '.git/hooks');
  if (!fs.existsSync(hookDir)) {
    fs.mkdirSync(hookDir, { recursive: true });
  }

  const hookPath = path.join(hookDir, 'pre-commit');
  const hookContent = `#!/bin/sh
# Aurent POS Code Prosecutor Pre-commit Hook
node scripts/code-prosecutor.mjs --staged
`;

  fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
  console.log(`${COLOR.green}✅ Git pre-commit hook muvaffaqiyatli o'rnatildi:${COLOR.reset} ${hookPath}`);
}

/**
 * Asosiy ishga tushirish funksiyasi
 */
export async function runProsecutor(argv = process.argv.slice(2), cwd = process.cwd()) {
  const options = parseArgs(argv);

  if (options.help) {
    printHelp();
    return 0;
  }

  if (options.installHook) {
    installGitHook(cwd);
    return 0;
  }

  let targetFiles = options.files && options.files.length > 0
    ? expandFilePaths(options.files, cwd)
    : getChangedFilesFromGit(options, cwd);

  if (targetFiles.length === 0) {
    if (options.json) {
      const emptyJson = {
        timestamp: new Date().toISOString(),
        checkedFiles: [],
        violationsCount: 0,
        verdict: 'CLEAN',
        violations: [],
      };
      console.log(JSON.stringify(emptyJson, null, 2));
    } else if (!options.watch) {
      console.log(`${COLOR.yellow}ℹ️ O'zgargan kod fayllari topilmadi. Tekshiruv uchun fayllar yo'q.${COLOR.reset}`);
    }
    return 0;
  }

  const allViolations = [];
  const processedFiles = [];

  for (const filePath of targetFiles) {
    const fileInfo = loadFileInfo(filePath, cwd);
    if (!fileInfo) continue;

    processedFiles.push(filePath);
    const violations = auditFile(fileInfo);
    allViolations.push(...violations);
  }

  if (options.json) {
    const jsonOutput = {
      timestamp: new Date().toISOString(),
      checkedFiles: processedFiles,
      violationsCount: allViolations.length,
      verdict: allViolations.length === 0 ? 'CLEAN' : 'GUILTY',
      violations: allViolations,
    };
    console.log(JSON.stringify(jsonOutput, null, 2));
  } else {
    printConsoleIndictment(allViolations, processedFiles);
  }

  return allViolations.length > 0 ? 1 : 0;
}

// Watcher funksiyasi
function startWatchMode(cwd = process.cwd()) {
  console.log(`${COLOR.cyan}👁️ Code Prosecutor kuzatuv (watch) rejimida ishga tushdi... (Fayl saqlanganda avtomatik tekshiradi)${COLOR.reset}`);
  let debounceTimer = null;

  const trigger = () => {
    runProsecutor(['--staged=false'], cwd).catch(err => {
      console.error('Xatolik:', err);
    });
  };

  trigger();

  fs.watch(path.resolve(cwd, 'apps'), { recursive: true }, (eventType, filename) => {
    if (filename && /\.(jsx?|tsx?)$/.test(filename)) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log(`\n${COLOR.gray}O'zgarish aniqlandi: ${filename}${COLOR.reset}`);
        trigger();
      }, 1000);
    }
  });
}

// CLI sifatida to'g'ridan-to'g'ri chaqirilganda
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('code-prosecutor.mjs') || 
  process.argv[1].endsWith('code-prosecutor')
);

if (isDirectRun) {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
  } else if (options.watch) {
    startWatchMode();
  } else {
    runProsecutor(process.argv.slice(2)).then(exitCode => {
      process.exit(exitCode);
    }).catch(err => {
      console.error('Kutilmagan xatolik:', err);
      process.exit(1);
    });
  }
}
