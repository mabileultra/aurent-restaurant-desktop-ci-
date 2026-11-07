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
import {
  PLATFORM_MODULE_NAMES_UZ,
  PLATFORM_MODULE_NAMES_RU,
} from './platformModuleTranslations';

export {
  GROUP_TITLES_UZ,
  GROUP_TITLES_RU,
  ROLE_LABELS_UZ,
  ROLE_LABELS_RU,
  MODULE_NAMES_UZ,
  MODULE_NAMES_RU,
  PLATFORM_MODULE_NAMES_UZ,
  PLATFORM_MODULE_NAMES_RU,
};

function resolveLang(tOrLang) {
  if (typeof tOrLang === 'string') return tOrLang.startsWith('ru') ? 'ru' : 'uz';
  if (tOrLang?.language) return tOrLang.language.startsWith('ru') ? 'ru' : 'uz';
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem('pos-lang');
      if (stored) return stored.startsWith('ru') ? 'ru' : 'uz';
    } catch {
      // ignore
    }
  }
  return 'uz';
}

export function resolveRoleLabel(roleCode, tOrLang = 'uz') {
  const code = String(roleCode || '').toUpperCase();
  if (typeof tOrLang === 'function') {
    const val = tOrLang(`roles.${code}`);
    if (val && val !== `roles.${code}`) return val;
  }
  const lang = resolveLang(tOrLang);
  if (lang === 'ru') return ROLE_LABELS_RU[code] || code;
  return ROLE_LABELS_UZ[code] || code;
}

export function resolveBusinessTypeName(btCode, tOrLang = 'uz') {
  const code = String(btCode || '').toUpperCase();
  const lang = resolveLang(tOrLang);
  if (code === 'PLATFORM_STAFF') {
    return lang === 'ru' ? 'Платформа' : 'Platforma';
  }
  if (typeof tOrLang === 'function') {
    const val = tOrLang(`businessTypes.${code}`);
    if (val && val !== `businessTypes.${code}`) return val;
  }
  if (lang === 'ru') return BUSINESS_TYPE_NAMES_RU[code] || code;
  return BUSINESS_TYPE_NAMES_UZ[code] || code;
}

export function resolveModuleName(moduleId, catalogMap = {}, tOrLang = 'uz') {
  const id = String(moduleId || '');
  const lang = resolveLang(tOrLang);
  if (lang === 'ru') {
    return (
      PLATFORM_MODULE_NAMES_RU[id] ||
      MODULE_NAMES_RU[id] ||
      (typeof tOrLang === 'function' && tOrLang(`nav.modules.${id}`) !== `nav.modules.${id}` ? tOrLang(`nav.modules.${id}`) : null) ||
      catalogMap[id]?.name ||
      id
    );
  }
  return (
    PLATFORM_MODULE_NAMES_UZ[id] ||
    MODULE_NAMES_UZ[id] ||
    (typeof tOrLang === 'function' && tOrLang(`nav.modules.${id}`) !== `nav.modules.${id}` ? tOrLang(`nav.modules.${id}`) : null) ||
    catalogMap[id]?.name ||
    id
  );
}

export function buildCatalogGroups(rawCatalog = [], businessType = 'RESTAURANT', tOrLang = 'uz', allowedModuleIds = null) {
  const map = new Map();
  const lang = typeof tOrLang === 'string' ? tOrLang : (tOrLang?.language === 'ru' ? 'ru' : 'uz');
  const titles = lang === 'ru' ? GROUP_TITLES_RU : GROUP_TITLES_UZ;
  const isPlatformStaff = businessType === 'PLATFORM_STAFF';

  rawCatalog.forEach((item) => {
    if (allowedModuleIds) {
      if (!allowedModuleIds.has(item.id)) return;
    } else {
      const isPlatformMod = PLATFORM_MODULE_KEYS.has(item.id);
      if (isPlatformStaff) {
        if (!isPlatformMod) return;
      } else {
        if (isPlatformMod) return;
        if (!isModuleVisibleForBusinessType(item.id, businessType)) return;
      }
    }

    const groupId = item.group || 'main';
    if (!map.has(groupId)) {
      const title = titles[groupId] || (typeof tOrLang === 'function' ? tOrLang(`nav.${groupId}Group`) : groupId);

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

export function computeNetworkStats(statsByCode = new Map()) {
  let totalEmployees = 0;
  let exceptionEmployees = 0;
  let bTypesCount = 0;

  statsByCode.forEach((item, code) => {
    const upperCode = String(code || '').toUpperCase();
    if (upperCode !== 'PLATFORM_STAFF' && upperCode !== 'ALL' && upperCode !== 'UNKNOWN') {
      bTypesCount += 1;
      totalEmployees += Number(item.totalEmployees || 0);
      exceptionEmployees += Number(item.exceptionCount || 0);
    }
  });

  return {
    totalEmployees,
    exceptionEmployees,
    standardEmployees: Math.max(0, totalEmployees - exceptionEmployees),
    businessTypesCount: bTypesCount,
  };
}
