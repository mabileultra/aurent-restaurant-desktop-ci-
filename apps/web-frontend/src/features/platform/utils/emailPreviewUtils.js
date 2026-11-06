/**
 * Auditoriya rejimiga qarab xat ko'rinishi (preview) uchun mos foydalanuvchilar namunasini tanlaydi.
 * Agar tanlangan auditoriyadan mos xodim topilmasa, demo namunaga fallback qiladi va isDemo: true qaytaradi.
 */
export function getPreviewSamples({ mode, manualUsers = [], roles = {}, selectedCompanies = new Set() }) {
  if (mode === 'manual') {
    const checked = manualUsers.filter((u) => u.checked);
    if (checked.length > 0) {
      return { samples: checked, isDemo: false };
    }
    return { samples: manualUsers.slice(0, 1), isDemo: true };
  }

  if (mode === 'role') {
    const roleMatched = manualUsers.filter((u) => {
      const code = u.roleCode || (u.role === 'Administrator' ? 'ADMIN' : u.role === 'Kassir' ? 'CASHIER' : u.role === 'Menejer' ? 'MANAGER' : u.role === 'Ofitsiant' ? 'WAITER' : 'COOK');
      return Boolean(roles[code]);
    });
    if (roleMatched.length > 0) {
      return { samples: roleMatched, isDemo: false };
    }
    return { samples: manualUsers.slice(0, 1), isDemo: true };
  }

  if (mode === 'company') {
    const companyMatched = manualUsers.filter((u) => {
      const cid = u.companyId || (u.company?.includes('XAN') ? 'c1' : u.company?.includes('DOSTON') ? 'c2' : 'c3');
      return selectedCompanies.has(cid);
    });
    if (companyMatched.length > 0) {
      return { samples: companyMatched, isDemo: false };
    }
    return { samples: manualUsers.slice(0, 1), isDemo: true };
  }

  // mode === 'all'
  return {
    samples: manualUsers.length > 0 ? manualUsers : [{ name: 'Foydalanuvchi', email: 'user@aurent.uz', role: 'Xodim', company: 'Aurent POS' }],
    isDemo: false,
  };
}
