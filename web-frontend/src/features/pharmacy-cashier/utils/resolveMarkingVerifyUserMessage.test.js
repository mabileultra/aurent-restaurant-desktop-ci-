import { describe, expect, it } from 'vitest';
import {
  classifyMarkingVerifyFailure,
  isAslIntegrationDisabledError,
  resolveCashierMarkingMissMessage,
  resolveMarkingVerifyUserMessage,
} from './resolveMarkingVerifyUserMessage';

const t = (key, params) => (params?.name ? `${key}:${params.name}` : key);

describe('resolveMarkingVerifyUserMessage', () => {
  it('detects disabled ASL from backend text', () => {
    expect(isAslIntegrationDisabledError({
      response: { data: { message: 'ASL Belgisi marking is disabled for this store' } },
    })).toBe(true);
  });

  it('does not treat rejected API key as missing integration', () => {
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

  it('says no integration when ASL is off', () => {
    expect(classifyMarkingVerifyFailure({ aslEnabled: false })).toBe('no-integration');
    expect(resolveMarkingVerifyUserMessage({ aslEnabled: false, t }))
      .toBe('pharmacyCashier.integrations.markingApiDisabled');
  });

  it('says product not found when ASL is on', () => {
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

  it('says catalog miss when ASL found name but no local product', () => {
    expect(resolveMarkingVerifyUserMessage({
      aslEnabled: true,
      aslResult: { found: true, productName: 'Л-ЦЕТ' },
      t,
    })).toBe('pharmacyCashier.integrations.markingCatalogMiss:Л-ЦЕТ');
  });

  it('does not dump raw API errors when ASL is off but request failed', () => {
    expect(resolveMarkingVerifyUserMessage({
      aslEnabled: false,
      aslError: { response: { data: { message: 'Internal boom\nstack\nmore' } } },
      t,
    })).toBe('pharmacyCashier.integrations.markingApiDisabled');
  });

  it('cashier miss without ASL says product not found, not missing integration', () => {
    expect(resolveCashierMarkingMissMessage({
      aslEnabled: false,
      t,
      keys: { notFound: 'pos.markingNotFound' },
    })).toBe('pos.markingNotFound');
  });

  it('cashier miss does not ask for ASL when backend says marking is disabled', () => {
    expect(resolveCashierMarkingMissMessage({
      aslEnabled: true,
      aslError: { response: { data: { message: 'ASL Belgisi marking is disabled for this store' } } },
      t,
      keys: { notFound: 'pos.markingNotFound' },
    })).toBe('pos.markingNotFound');
  });
});
