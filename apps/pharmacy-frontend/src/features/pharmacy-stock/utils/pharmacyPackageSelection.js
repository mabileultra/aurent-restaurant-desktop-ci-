export function realTasnifPackages(item) {
  return (item?.packages ?? []).filter((pkg) => {
    const code = String(pkg?.code || '').trim();
    return /^\d{3,}$/.test(code) && code !== '1';
  });
}

export function tasnifPackageLabel(pkg, lang = 'ru') {
  if (!pkg) return '';
  if (String(lang).startsWith('uz')) {
    return pkg.nameUz || pkg.nameRu || pkg.nameLat || pkg.code;
  }
  return pkg.nameRu || pkg.nameUz || pkg.nameLat || pkg.code;
}
