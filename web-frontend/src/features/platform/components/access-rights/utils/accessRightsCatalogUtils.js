import { isModuleVisibleForBusinessType } from '../../../utils/moduleAccessByBusinessType';
import { PLATFORM_MODULE_KEYS, BUSINESS_TYPE_NAMES_UZ, BUSINESS_TYPE_NAMES_RU } from './roleDefaultModules';
import {
  GROUP_TITLES_UZ,
  GROUP_TITLES_RU,
  ROLE_LABELS_UZ,
  ROLE_LABELS_RU,
  MODULE_NAMES_UZ,
  MODULE_NAMES_RU,
} from './accessRightsTranslations';

export {
  GROUP_TITLES_UZ,
  GROUP_TITLES_RU,
  ROLE_LABELS_UZ,
  ROLE_LABELS_RU,
  MODULE_NAMES_UZ,
  MODULE_NAMES_RU,
};

export function resolveRoleLabel(roleCode, tOrLang = 'uz') {
  const code = String(roleCode || '').toUpperCase();
  if (typeof tOrLang === 'function') {
    const val = tOrLang(`roles.${code}`);
    if (val && val !== `roles.${code}`) return val;
  }
  const lang = typeof tOrLang === 'string' ? tOrLang : 'uz';
  if (lang === 'ru') return ROLE_LABELS_RU[code] || code;
  return ROLE_LABELS_UZ[code] || code;
}

export function resolveBusinessTypeName(btCode, tOrLang = 'uz') {
  const code = String(btCode || '').toUpperCase();
  if (typeof tOrLang === 'function') {
    const val = tOrLang(`businessTypes.${code}`);
    if (val && val !== `businessTypes.${code}`) return val;
  }
  const lang = typeof tOrLang === 'string' ? tOrLang : 'uz';
  if (lang === 'ru') return BUSINESS_TYPE_NAMES_RU[code] || code;
  return BUSINESS_TYPE_NAMES_UZ[code] || code;
}

export function resolveModuleName(moduleId, catalogMap = {}, tOrLang = 'uz') {
  const id = String(moduleId || '');
  if (typeof tOrLang === 'function') {
    const val = tOrLang([`nav.${id}`, `platform.modules.${id}`]);
    if (val && val !== `nav.${id}` && val !== `platform.modules.${id}`) return val;
  }
  const lang = typeof tOrLang === 'string' ? tOrLang : 'uz';
  if (lang === 'ru') return MODULE_NAMES_RU[id] || catalogMap[id]?.name || id;
  return MODULE_NAMES_UZ[id] || catalogMap[id]?.name || id;
}

export function buildCatalogGroups(rawCatalog = [], businessType = 'RESTAURANT', tOrLang = 'uz') {
  const map = new Map();
  const isFn = typeof tOrLang === 'function';
  const lang = typeof tOrLang === 'string' ? tOrLang : 'uz';
  const titles = lang === 'ru' ? GROUP_TITLES_RU : GROUP_TITLES_UZ;

  rawCatalog.forEach((item) => {
    if (PLATFORM_MODULE_KEYS.has(item.id)) return;
    if (!isModuleVisibleForBusinessType(item.id, businessType)) return;

    const groupId = item.group || 'main';
    if (!map.has(groupId)) {
      const title = isFn
        ? tOrLang([`platform.moduleAccess.groups.${groupId}`, `nav.${groupId}Group`], { defaultValue: titles[groupId] || groupId })
        : (titles[groupId] || groupId);

      map.set(groupId, {
        id: groupId,
        title,
        modules: [],
      });
    }

    const name = resolveModuleName(item.id, {}, tOrLang);

    map.get(groupId).modules.push({
      id: item.id,
      name,
    });
  });

  return Array.from(map.values()).filter((g) => g.modules.length > 0);
}

export function buildCatalogMap(rawCatalog = [], tOrLang = 'uz') {
  const map = {};
  rawCatalog.forEach((item) => {
    map[item.id] = {
      id: item.id,
      name: resolveModuleName(item.id, {}, tOrLang),
      group: item.group || 'main',
    };
  });
  return map;
}
