/**
 * Aurent POS — Code Prosecutor Runner Automated Verification Tests
 * 
 * Ushbu test to'plami quyidagilarni to'liq tekshiradi:
 * 1. CLI argumentlarini parse qilish (`parseArgs`);
 * 2. TC-01..TC-06 buzilgan test namunalarida to'g'ri Ayblov Moddalari aniqlanishi;
 * 3. TC-07 toza namunada 0 ta ayblov bilan oqlanishi (False Positive yo'qligi);
 * 4. Backend chegarasi (Modda 1) buzilishi aniqlanishi;
 * 5. CLI runner orqali exit code 1 (aybdor) va exit code 0 (oqlandi) qaytishi;
 * 6. JSON dossier formati (`--json`).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  parseArgs,
  loadFileInfo,
  expandFilePaths,
  isMagicNumberViolation,
  isRawDateInput,
  auditFile,
  runProsecutor,
} from '../scripts/code-prosecutor.mjs';

const FIXTURES_DIR = path.resolve(process.cwd(), 'tests/fixtures/prosecutor');

describe('Code Prosecutor Runner — Unit & Integration Tests', () => {
  describe('1. CLI Argument Parsing (parseArgs)', () => {
    it('barcha flaglarni to\'g\'ri ajratishi kerak', () => {
      const args = ['--watch', '--staged', '--json', '--files', 'file1.jsx', 'file2.jsx'];
      const options = parseArgs(args);

      assert.equal(options.watch, true);
      assert.equal(options.staged, true);
      assert.equal(options.json, true);
      assert.deepEqual(options.files, ['file1.jsx', 'file2.jsx']);
    });

    it('bo\'sh argumentlarda standart qiymatlarni qaytarishi kerak', () => {
      const options = parseArgs([]);
      assert.equal(options.watch, false);
      assert.equal(options.staged, false);
      assert.equal(options.all, false);
      assert.equal(options.json, false);
      assert.equal(options.installHook, false);
      assert.deepEqual(options.files, []);
    });
  });

  describe('2. Test Fixtures Audit (TC-01..TC-07)', () => {
    it('TC-01: Modda 3 (SRP >200 qator) qoidabuzarligini aniqlashi shart', () => {
      const fileInfo = loadFileInfo(path.join(FIXTURES_DIR, 'TC-01-FlawedProductTableMonolith.jsx'));
      assert.ok(fileInfo, 'Fayl yuklanmadi');
      assert.ok(fileInfo.totalLines > 200, `Fayl qatorlari 200 dan kam: ${fileInfo.totalLines}`);

      const violations = auditFile(fileInfo);
      assert.ok(violations.length > 0, 'Kamida 1 ta ayblov bo\'lishi shart');

      const srpViolation = violations.find(v => v.article.includes('Modda 3'));
      assert.ok(srpViolation, 'Modda 3 bo\'yicha ayblov topilmadi');
      assert.equal(srpViolation.severity, 'YUQORI');
    });

    it('TC-02: Modda 4 (DRY va Xom HTML) qoidabuzarliklarini aniqlashi shart', () => {
      const fileInfo = loadFileInfo(path.join(FIXTURES_DIR, 'TC-02-FlawedOrderFilters.jsx'));
      assert.ok(fileInfo, 'Fayl yuklanmadi');

      const violations = auditFile(fileInfo);
      assert.ok(violations.length >= 3, `Ayblovlar yetarli emas: ${violations.length}`);

      const selectViolation = violations.find(v => v.verbatim.includes('<select'));
      const dateViolation = violations.find(v => v.verbatim.includes('type="date"'));
      const helperViolation = violations.find(v => v.verbatim.includes('formatCustomUzDate'));

      assert.ok(selectViolation, 'Xom <select> bo\'yicha ayblov topilmadi');
      assert.ok(dateViolation, 'Xom <input type="date"> bo\'yicha ayblov topilmadi');
      assert.ok(helperViolation, 'Lokal sana formati nusxalanishi bo\'yicha ayblov topilmadi');
    });

    it('TC-03: Modda 2 (Frontendda og\'ir backend mantiqi) qoidabuzarligini aniqlashi shart', () => {
      const fileInfo = loadFileInfo(path.join(FIXTURES_DIR, 'TC-03-FlawedTasnifClassifier.jsx'));
      assert.ok(fileInfo, 'Fayl yuklanmadi');

      const violations = auditFile(fileInfo);
      assert.ok(violations.length > 0, 'Ayblov bo\'lishi shart');

      const backendLogicViolation = violations.find(v => v.article.includes('Modda 2'));
      assert.ok(backendLogicViolation, 'Modda 2 bo\'yicha ayblov topilmadi');
      assert.equal(backendLogicViolation.severity, 'KRITIK');
    });

    it('TC-04: Modda 5 (Full-Table va Memory Leak) ikkala qoidabuzarligini aniqlashi shart', () => {
      const fileInfo = loadFileInfo(path.join(FIXTURES_DIR, 'TC-04-FlawedDashboardKpiCard.jsx'));
      assert.ok(fileInfo, 'Fayl yuklanmadi');

      const violations = auditFile(fileInfo);
      assert.ok(violations.length >= 2, `Kamida 2 ta ayblov kutilgan, olingan: ${violations.length}`);

      const fullTableViolation = violations.find(v => v.article.includes('Full-Table'));
      const memoryLeakViolation = violations.find(v => v.article.includes('Memory Leak'));

      assert.ok(fullTableViolation, 'Full-Table getAll bo\'yicha ayblov topilmadi');
      assert.ok(memoryLeakViolation, 'useEffect cleanupsiz memory leak bo\'yicha ayblov topilmadi');
    });

    it('TC-05: Modda 6 (Clean Code: sehrli sonlar, noaniq nomlash, console.log) ni aniqlashi shart', () => {
      const fileInfo = loadFileInfo(path.join(FIXTURES_DIR, 'TC-05-FlawedShiftCheckoutManager.jsx'));
      assert.ok(fileInfo, 'Fayl yuklanmadi');

      const violations = auditFile(fileInfo);
      assert.ok(violations.length >= 3, `Ayblovlar kam: ${violations.length}`);

      const consoleLogViolation = violations.find(v => v.verbatim.includes('console.log'));
      const namingViolation = violations.find(v => v.verbatim.includes('const a =') || v.verbatim.includes('let temp ='));
      const magicNumberViolation = violations.find(v => v.article.includes('Sehrli Sonlar'));

      assert.ok(consoleLogViolation, 'console.log bo\'yicha ayblov topilmadi');
      assert.ok(namingViolation, 'Noaniq nomlash bo\'yicha ayblov topilmadi');
      assert.ok(magicNumberViolation, 'Sehrli sonlar bo\'yicha ayblov topilmadi');
    });

    it('TC-06: Modda 7 (UI/UX: tap target < 44px va semantik rang shovqini) ni aniqlashi shart', () => {
      const fileInfo = loadFileInfo(path.join(FIXTURES_DIR, 'TC-06-FlawedCashierPaymentAction.jsx'));
      assert.ok(fileInfo, 'Fayl yuklanmadi');

      const violations = auditFile(fileInfo);
      assert.ok(violations.length >= 2, `Ayblovlar kam: ${violations.length}`);

      const tapTargetViolation = violations.find(v => v.article.includes('Tap target < 44px'));
      const colorNoiseViolation = violations.find(v => v.article.includes('Semantik Rang Shovqini'));

      assert.ok(tapTargetViolation, 'Tap target < 44px bo\'yicha ayblov topilmadi');
      assert.ok(colorNoiseViolation, 'Rang shovqini bo\'yicha ayblov topilmadi');
    });

    it('TC-07: Toza komponentda 0 ta ayblov bo\'lishi va OQLANISHI (CLEAN) shart (False Positive = 0)', () => {
      const fileInfo = loadFileInfo(path.join(FIXTURES_DIR, 'TC-07-CleanSalesSummaryCard.jsx'));
      assert.ok(fileInfo, 'Fayl yuklanmadi');

      const violations = auditFile(fileInfo);
      assert.equal(violations.length, 0, `Toza komponentda ayblovlar chiqmasligi kerak: ${JSON.stringify(violations)}`);
    });
  });

  describe('3. Backend Scope Guard (Modda 1)', () => {
    it('Backend katalogidagi fayl berilganda Modda 1 bo\'yicha ayblov chiqarishi shart', () => {
      const fileInfo = loadFileInfo('web-backend/pom.xml');
      assert.ok(fileInfo, 'Backend fayli mavjud emas');

      const violations = auditFile(fileInfo);
      const backendScopeViolation = violations.find(v => v.article.includes('Modda 1'));

      assert.ok(backendScopeViolation, 'Modda 1 (Backend Chegarasi) bo\'yicha ayblov topilmadi');
      assert.equal(backendScopeViolation.severity, 'KRITIK');
    });
  });

  describe('4. CLI Runner E2E va Exit Codes', () => {
    it('Buzilgan fayllarda runProsecutor exit code 1 qaytarishi shart', async () => {
      const exitCode = await runProsecutor([
        '--files',
        path.join(FIXTURES_DIR, 'TC-01-FlawedProductTableMonolith.jsx'),
      ]);
      assert.equal(exitCode, 1, 'Buzilgan faylda exit code 1 bo\'lishi shart');
    });

    it('Toza faylda runProsecutor exit code 0 qaytarishi shart', async () => {
      const exitCode = await runProsecutor([
        '--files',
        path.join(FIXTURES_DIR, 'TC-07-CleanSalesSummaryCard.jsx'),
      ]);
      assert.equal(exitCode, 0, 'Toza faylda exit code 0 bo\'lishi shart');
    });
  });

  describe('5. False Positive Prevention & Edge-Case Rules', () => {
    it('<PlatformDatePicker type="date" /> toza o\'tishi (false positive yo\'qligi) kerak', () => {
      const code = `
        import React from 'react';
        import { PlatformDatePicker } from './components';

        export function CleanDateFilter({ value, onChange }) {
          return (
            <div className="p-4">
              <PlatformDatePicker
                type="date"
                value={value}
                onChange={onChange}
                label="Sana tanlang"
              />
            </div>
          );
        }
      `;
      const lines = code.trim().split('\n');
      const fileInfo = {
        filePath: 'apps/web-frontend/src/CleanDateFilter.jsx',
        fullPath: '/apps/web-frontend/src/CleanDateFilter.jsx',
        content: code,
        lines,
        sanitized: lines,
        totalLines: lines.length,
        diff: '',
      };
      const violations = auditFile(fileInfo);
      const falsePositive = violations.find(v => v.article.includes('Modda 4'));
      assert.equal(falsePositive, undefined, 'PlatformDatePicker xom input deb asossiz ayblanmasligi kerak');
    });

    it('Modda 3 (SRP > 200 qator) faqat skriptlarga (.js, .jsx, .ts, .tsx, .vue) tegishli bo\'lishi, .json va .css ni ayblamasligi kerak', () => {
      const jsonContent = JSON.stringify(Array(250).fill('val'), null, 2);
      const jsonLines = jsonContent.split('\n');
      const jsonFileInfo = {
        filePath: 'apps/web-frontend/src/locales/uz.json',
        fullPath: '/apps/web-frontend/src/locales/uz.json',
        content: jsonContent,
        lines: jsonLines,
        sanitized: jsonLines,
        totalLines: jsonLines.length,
        diff: '',
      };
      const jsonViolations = auditFile(jsonFileInfo);
      const srpJsonViolation = jsonViolations.find(v => v.article.includes('Modda 3'));
      assert.equal(srpJsonViolation, undefined, 'JSON fayllarida Modda 3 bo\'yicha ayblov chiqmasligi kerak');

      const cssContent = Array(250).fill('.btn { color: red; }').join('\n');
      const cssLines = cssContent.split('\n');
      const cssFileInfo = {
        filePath: 'apps/web-frontend/src/styles/app.css',
        fullPath: '/apps/web-frontend/src/styles/app.css',
        content: cssContent,
        lines: cssLines,
        sanitized: cssLines,
        totalLines: cssLines.length,
        diff: '',
      };
      const cssViolations = auditFile(cssFileInfo);
      const srpCssViolation = cssViolations.find(v => v.article.includes('Modda 3'));
      assert.equal(srpCssViolation, undefined, 'CSS fayllarida Modda 3 bo\'yicha ayblov chiqmasligi kerak');
    });

    it('Sehrli sonlar qoidasi (Modda 6) umumiy ixtiyoriy sonlarni (250, 0.25) tutishi va UPPER_CASE konstantalarni oqlashi kerak', () => {
      assert.equal(isMagicNumberViolation('const price = total * 0.25;'), true);
      assert.equal(isMagicNumberViolation('if (count > 250) {'), true);
      assert.equal(isMagicNumberViolation('if (status === 3) {'), true);
      assert.equal(isMagicNumberViolation('const DEFAULT_TAX_RATE = 0.12;'), false);
      assert.equal(isMagicNumberViolation('if (items.length > 0) {'), false);
      assert.equal(isMagicNumberViolation('if (index === -1) {'), false);
      assert.equal(isMagicNumberViolation('if (page === 1) {'), false);
      assert.equal(isMagicNumberViolation('const pct = (x / total) * 100;'), false);
    });

    it('Modda 4: Lokal sana formatlash funksiyalari umumiy nomlar bilan ham aniqlanishi kerak', () => {
      const code = `
        const formatOrderDate = (date) => date.toISOString();
        function getTransactionDateString(d) { return String(d); }
      `;
      const lines = code.trim().split('\n');
      const fileInfo = {
        filePath: 'apps/web-frontend/src/OrderDateHelper.jsx',
        fullPath: '/apps/web-frontend/src/OrderDateHelper.jsx',
        content: code,
        lines,
        sanitized: lines,
        totalLines: lines.length,
        diff: '',
      };
      const violations = auditFile(fileInfo);
      const dateHelperViolations = violations.filter(v => v.article.includes('Modda 4') && v.reason.includes('Sana formatlash'));
      assert.ok(dateHelperViolations.length >= 2, `Kamida 2 ta lokal sana formatlash ayblovi kutilgan, olingan: ${dateHelperViolations.length}`);
    });
  });

  describe('6. CLI Usability, JSON Output & Edge Cases', () => {
    it('--help va -h flaglari exit code 0 qaytarishi kerak', async () => {
      const exitCode1 = await runProsecutor(['--help']);
      assert.equal(exitCode1, 0, '--help exit code 0 bo\'lishi shart');

      const exitCode2 = await runProsecutor(['-h']);
      assert.equal(exitCode2, 0, '-h exit code 0 bo\'lishi shart');
    });

    it('--json bo\'sh diffda to\'g\'ri parse bo\'luvchi toza JSON chiqarishi kerak', async () => {
      const originalLog = console.log;
      let capturedOutput = '';
      console.log = (msg) => {
        capturedOutput += msg + '\n';
      };

      try {
        const exitCode = await runProsecutor(['--json', '--files', 'non_existing_file_never_exists.jsx']);
        assert.equal(exitCode, 0);

        const parsed = JSON.parse(capturedOutput.trim());
        assert.equal(parsed.verdict, 'CLEAN');
        assert.equal(parsed.violationsCount, 0);
        assert.deepEqual(parsed.checkedFiles, []);
        assert.deepEqual(parsed.violations, []);
      } finally {
        console.log = originalLog;
      }
    });

    it('--files orqali papka uzatilganda EISDIR xatosiz papka ichidagi kod fayllarini topishi kerak', () => {
      const expanded = expandFilePaths(['tests/fixtures/prosecutor']);
      assert.ok(expanded.length >= 7, `Kamida 7 ta fixture topilishi kerak, topildi: ${expanded.length}`);
      assert.ok(expanded.some(f => f.includes('TC-01')), 'TC-01 topilmadi');
    });

    it('Git statusdagi probelli fayl nomi va rename (->) to\'g\'ri ajratilishi kerak', () => {
      const quotedPath = '"apps/web-frontend/Order Details Modal.jsx"';
      const cleanQuoted = quotedPath.replace(/^"|"$/g, '');
      assert.equal(cleanQuoted, 'apps/web-frontend/Order Details Modal.jsx');

      const renamedLine = 'R  apps/web-frontend/old.jsx -> apps/web-frontend/new.jsx';
      let filePath = renamedLine.substring(3).trim();
      if (filePath.includes(' -> ')) {
        filePath = filePath.split(' -> ')[1].trim();
      }
      assert.equal(filePath, 'apps/web-frontend/new.jsx');
    });
  });
});
