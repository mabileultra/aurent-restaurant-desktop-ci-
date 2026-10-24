import { describe, expect, it } from 'vitest';
import {
  classifyMarkingVerifyFailure,
  isAslIntegrationDisabledError,
  resolveCashierMarkingMissMessage,
  resolveMarkingVerifyUserMessage,
} from './resolveMarkingVerifyUserMessage';

const t = (key, params) => (params?.name ? `${key}:${params.name}` : key);

describe('тексты проверки маркировки', () => {
  it('бэкенд «marking is disabled» — нет интеграции, не отказ ключа', () => {
    expect(isAslIntegrationDisabledError({
      response: { data: { message: 'ASL Belgisi marking is disabled for this store' } },
    })).toBe(true);
  });

  it('отклонённый API-ключ не считается «интеграции нет»', () => {
    const err = {
      response: {
        data: {
          message: 'ASL Belgisi не принял API-ключ. Нужен Bearer apiKey бизнес-пользователя (Open API).',
        },
      },
    };
    expect(isAslIntegrationDisabledError(err)).toBe(false);
    expect(classifyMarkingVerifyFailure({ aslEnabled: true, aslError: err })).toBe('bad-api-key');
    expect(resolveMarkingVerifyUserMessage({ aslEnabled: true, aslError: err, t }))
      .toBe('pharmacyCashier.integrations.markingApiKeyRejected');
  });

  it('ASL выключена — приёмка просит ключ', () => {
    expect(classifyMarkingVerifyFailure({ aslEnabled: false })).toBe('no-integration');
    expect(resolveMarkingVerifyUserMessage({ aslEnabled: false, t }))
      .toBe('pharmacyCashier.integrations.markingApiDisabled');
  });

  it('ASL включена, кода нет — «нужна карточка», без сырого API', () => {
    expect(classifyMarkingVerifyFailure({
      aslEnabled: true,
      aslResult: { found: false },
    })).toBe('not-found');
    expect(resolveMarkingVerifyUserMessage({
      aslEnabled: true,
      aslResult: { found: false },
      t,
    })).toBe('pharmacyCashier.integrations.markingCatalogNeed');
  });

  it('ASL знает имя, локально товара нет — catalog miss', () => {
    expect(resolveMarkingVerifyUserMessage({
      aslEnabled: true,
      aslResult: { found: true, productName: 'Л-ЦЕТ' },
      t,
    })).toBe('pharmacyCashier.integrations.markingCatalogMiss:Л-ЦЕТ');
  });

  it('приёмка не показывает дамп API, если ASL выключена', () => {
    expect(resolveMarkingVerifyUserMessage({
      aslEnabled: false,
      aslError: { response: { data: { message: 'Internal boom\nstack\nmore' } } },
      t,
    })).toBe('pharmacyCashier.integrations.markingApiDisabled');
  });

  it('касса без ASL: товар не найден, не «нет интеграции»', () => {
    expect(resolveCashierMarkingMissMessage({
      aslEnabled: false,
      t,
      keys: { notFound: 'pos.markingNotFound' },
    })).toBe('pos.markingNotFound');
  });

  it('касса не просит ASL, если бэкенд сказал marking is disabled', () => {
    expect(resolveCashierMarkingMissMessage({
      aslEnabled: true,
      aslError: { response: { data: { message: 'ASL Belgisi marking is disabled for this store' } } },
      t,
      keys: { notFound: 'pos.markingNotFound' },
    })).toBe('pos.markingNotFound');
  });
});
