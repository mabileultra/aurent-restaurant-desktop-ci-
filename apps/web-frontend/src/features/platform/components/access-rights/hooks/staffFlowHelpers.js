import { getDefaultModulesForRole, getScopeForRole } from '../utils/roleDefaultModules';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function isNewStaffUser(createdAt, now = Date.now(), daysMs = SEVEN_DAYS_MS) {
  if (!createdAt) return false;
  const time = typeof createdAt === 'number' ? createdAt : Date.parse(createdAt);
  if (!Number.isFinite(time)) return false;
  return now - time <= daysMs;
}

/**
 * Backenddan kelgan userDetail (modules massivi) va selectedUser asosida
 * shablon modullari, foydalanuvchi modullari va boshlang'ich overrides holatini hisoblash (Pure function)
 */
export function parseUserDetailModules(userDetail, selectedUser, rawCatalog = []) {
  if (!selectedUser) {
    return {
      userModules: [],
      templateModules: new Set(),
      initialOverrides: {},
    };
  }

  const bt = selectedUser.businessType || 'RESTAURANT';
  const role = selectedUser.role || 'CASHIER';
  const scopeSet = getScopeForRole(role, bt);
  const defaultSet = getDefaultModulesForRole(role, bt);

  const rawRows = Array.isArray(userDetail?.modules) ? userDetail.modules : [];
  const hasBackendDetail = rawRows.length > 0;
  const isCustom = Boolean(userDetail?.moduleAccessCustom ?? selectedUser.moduleAccessCustom);

  const templateModules = new Set();
  const userModules = [];
  const initialOverrides = {};

  if (hasBackendDetail) {
    rawRows.forEach((row) => {
      if (!row || !row.id) return;
      const modId = row.id;
      userModules.push({
        id: modId,
        roleDefault: Boolean(row.roleDefault),
        allowed: Boolean(row.allowed),
      });

      if (row.roleDefault) {
        templateModules.add(modId);
      }

      if (isCustom) {
        if (row.allowed && !row.roleDefault) {
          initialOverrides[modId] = 'grant';
        } else if (!row.allowed && row.roleDefault) {
          initialOverrides[modId] = 'deny';
        } else {
          initialOverrides[modId] = 'template';
        }
      } else {
        initialOverrides[modId] = 'template';
      }
    });
  } else {
    // Backend hali detail qaytarmagan bo'lsa (yoki yuklanayotganda) rol doirasi bo'yicha fallback
    const catalogFiltered = rawCatalog.filter((m) => scopeSet.has(m.id));
    const itemsToUse = catalogFiltered.length > 0
      ? catalogFiltered
      : Array.from(scopeSet).map((id) => ({ id }));

    itemsToUse.forEach((item) => {
      const inDefault = defaultSet.has(item.id);
      userModules.push({
        id: item.id,
        roleDefault: inDefault,
        allowed: inDefault,
      });
      if (inDefault) {
        templateModules.add(item.id);
      }
      initialOverrides[item.id] = 'template';
    });
  }

  return {
    userModules,
    templateModules,
    initialOverrides,
  };
}

/**
 * Xodim huquqlarini saqlash uchun yakuniy modules xaritasi va istisno bor-yo'qligini aniqlash (Pure function)
 */
export function buildFinalUserModules(userModules = [], overrides = {}, templateModules = new Set()) {
  const finalModules = {};
  let hasAnyException = false;

  userModules.forEach((m) => {
    const inTpl = templateModules.has(m.id);
    const mode = overrides[m.id] || 'template';

    let allowed = inTpl;
    if (mode === 'grant') allowed = true;
    else if (mode === 'deny') allowed = false;

    finalModules[m.id] = allowed;

    if (allowed !== inTpl) {
      hasAnyException = true;
    }
  });

  return {
    finalModules,
    hasAnyException,
  };
}
