import { describe, expect, it } from 'vitest';
import ru from '../../locales/ru.json';
import uz from '../../locales/uz.json';
import { mapFiscalDriveError } from '../../services/fiscal/providers/fiscalDrive/mapFiscalDriveError';
import {
  resolveCashierMarkingMissMessage,
  resolveMarkingVerifyUserMessage,
} from '../pharmacy-cashier/utils/resolveMarkingVerifyUserMessage';

const POS_KEYS = [
  'markingNotFound',
  'markingAlreadySold',
  'markingAlreadyCounted',
  'markingSoldLocal',
  'markingInCirculation',
  'markingNotInCirculation',
  'markingRequiredBeforePay',
  'markingScanRequired',
];

const PHARMACY_KEYS = [
  'markingNotFound',
  'markingAlreadySold',
  'markingAlreadyCounted',
  'markingCatalogNeed',
  'markingCatalogMiss',
  'markingApiDisabled',
  'markingApiKeyRejected',
];

function readPath(locale, path) {
  return path.split('.').reduce((cur, part) => cur?.[part], locale);
}

function tFrom(locale) {
  return (key, params) => {
    const value = readPath(locale, key);
    if (typeof value !== 'string') return key;
    return params?.name ? value.replace('{{name}}', params.name) : value;
  };
}

function expectHumanText(text) {
  expect(String(text || '').trim().length).toBeGreaterThan(8);
  expect(text).not.toMatch(/Internal boom|stack|SWError|applet_impl|HTTP 500/i);
}

describe('касса: тексты ошибок маркировки и фискализации', () => {
  it.each([
    ['ru', ru],
    ['uz', uz],
  ])('%s: ключи кассы и аптеки заполнены, без дампа API', (_lang, locale) => {
    for (const key of POS_KEYS) {
      expectHumanText(locale.pos[key]);
    }
    for (const key of PHARMACY_KEYS) {
      expectHumanText(locale.pharmacyCashier.integrations[key]);
    }
    expect(locale.pos.markingNotFound).not.toMatch(/ASL|интеграц|integratsiya/i);
    expect(locale.pos.markingAlreadySold).toMatch(/пробит|urilgan/i);
    expect(locale.pos.markingInCirculation).toMatch(/оборот|aylanma/i);
    expect(locale.pharmacyCashier.integrations.markingApiDisabled).toMatch(/API/i);
  });

  it('касса без ASL говорит «товар не найден», а не «нет интеграции»', () => {
    const t = tFrom(ru);
    expect(resolveCashierMarkingMissMessage({
      aslEnabled: false,
      t,
      keys: { notFound: 'pos.markingNotFound' },
    })).toBe(ru.pos.markingNotFound);

    expect(resolveCashierMarkingMissMessage({
      aslEnabled: true,
      aslError: { response: { data: { message: 'ASL Belgisi marking is disabled for this store' } } },
      t,
      keys: { notFound: 'pos.markingNotFound' },
    })).toBe(ru.pos.markingNotFound);
  });

  it('приёмка с выключенным ASL говорит про ключ, касса — нет', () => {
    const t = tFrom(ru);
    expect(resolveMarkingVerifyUserMessage({ aslEnabled: false, t }))
      .toBe(ru.pharmacyCashier.integrations.markingApiDisabled);
    expect(resolveCashierMarkingMissMessage({
      aslEnabled: false,
      t,
      keys: { notFound: 'pos.markingNotFound' },
    })).not.toBe(ru.pharmacyCashier.integrations.markingApiDisabled);
  });

  it('FiscalDrive DateTime 500 — человеческая фраза, не Go ParseError', () => {
    const err = Object.assign(new Error('HTTP 500'), {
      status: 500,
      data: {
        Reason: 'parsing time "" as "2006-01-02 15:04:05": cannot parse "" as "2006"',
        Type: '*time.ParseError',
      },
    });
    const message = mapFiscalDriveError(err).message;
    expect(message).toBe('FiscalDrive не принял дату чека — повторите продажу из Aurent Desktop');
    expect(message).not.toMatch(/ParseError|2006-01-02/);
  });
});
