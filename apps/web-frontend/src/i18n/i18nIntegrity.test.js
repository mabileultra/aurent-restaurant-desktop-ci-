import { describe, expect, it } from 'vitest';
import i18n from './config';
import ru from '../locales/ru';
import uz from '../locales/uz';

describe('i18n integrity and namespace coverage', () => {
  it('loads both ru and uz resource dictionaries successfully', () => {
    expect(ru).toBeDefined();
    expect(uz).toBeDefined();
    expect(typeof ru).toBe('object');
    expect(typeof uz).toBe('object');
  });

  it('contains all essential domain namespaces in both languages', () => {
    const requiredKeys = [
      'common',
      'platform',
      'pos',
      'rst',
      'pharmacyStock',
      'products',
      'finance',
      'billing',
      'users',
      'cashRegisters',
      'reports',
      'desktop',
      'handbook',
      'login',
      'aiAssistant',
      'publicSite',
    ];

    for (const key of requiredKeys) {
      expect(ru[key], `RU missing key: ${key}`).toBeDefined();
      expect(uz[key], `UZ missing key: ${key}`).toBeDefined();
    }
  });

  it('translates common keys properly in i18next', async () => {
    await i18n.changeLanguage('ru');
    expect(i18n.t('common.save')).toBe('Сохранить');
    expect(i18n.t('common.cancel')).toBe('Отмена');

    await i18n.changeLanguage('uz');
    expect(i18n.t('common.save')).toBe('Saqlash');
    expect(i18n.t('common.cancel')).toBe('Bekor qilish');
  });

  it('translates nested platform keys correctly', async () => {
    await i18n.changeLanguage('ru');
    expect(i18n.t('platform.companies.title')).toBeTruthy();

    await i18n.changeLanguage('uz');
    expect(i18n.t('platform.companies.title')).toBeTruthy();
  });

  it('has matching top-level keys across ru and uz dictionaries', () => {
    const ruKeys = Object.keys(ru).sort();
    const uzKeys = Object.keys(uz).sort();
    expect(uzKeys).toEqual(ruKeys);
  });

  it('has 100% key parity across all nested leaf keys in ru and uz dictionaries', () => {
    function getLeafKeys(obj, prefix = '') {
      let keys = [];
      for (const [k, v] of Object.entries(obj)) {
        const full = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          keys = keys.concat(getLeafKeys(v, full));
        } else {
          keys.push(full);
        }
      }
      return keys;
    }

    const ruLeaf = new Set(getLeafKeys(ru));
    const uzLeaf = new Set(getLeafKeys(uz));

    const missingInUz = [...ruLeaf].filter((k) => !uzLeaf.has(k));
    const missingInRu = [...uzLeaf].filter((k) => !ruLeaf.has(k));

    expect(missingInUz).toEqual([]);
    expect(missingInRu).toEqual([]);
  });
});
