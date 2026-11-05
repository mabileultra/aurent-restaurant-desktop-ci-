/** Shared cache bust after store create/update/toggle/delete. */
export function invalidateStoresQueries(qc, { includeCompanies = false } = {}) {
  qc.invalidateQueries({ queryKey: ['stores-manage'] });
  qc.invalidateQueries({ queryKey: ['stores'] });
  qc.invalidateQueries({ queryKey: ['stores-all'] });
  qc.invalidateQueries({ queryKey: ['stores-stats'] });
  qc.invalidateQueries({ queryKey: ['stores-by-company'] });
  qc.invalidateQueries({ queryKey: ['stores-company-branches'] });
  qc.invalidateQueries({
    predicate: (q) => {
      const key = q.queryKey;
      return Array.isArray(key) && (key.includes('stores-user-form') || key.includes('platform-user-form'));
    },
  });
  if (includeCompanies) {
    qc.invalidateQueries({ queryKey: ['companies'] });
    qc.invalidateQueries({ queryKey: ['companies-all'] });
  }
}
