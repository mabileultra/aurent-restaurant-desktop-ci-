import { MODULE_ACCESS_NEW_USER_MAX_AGE_MS } from '../constants';

function parseCreatedAt(value) {
  if (value == null || value === '') return NaN;
  if (typeof value === 'number') return value;
  return Date.parse(value);
}

export function isNewModuleAccessUser(user, now = Date.now()) {
  const createdAt = parseCreatedAt(user?.createdAt);
  if (!Number.isFinite(createdAt)) return false;
  return now - createdAt <= MODULE_ACCESS_NEW_USER_MAX_AGE_MS;
}

export function companyNameById(companies = []) {
  const map = {};
  for (const company of companies) {
    if (company?.id == null) continue;
    map[String(company.id)] = company.name || '';
  }
  return map;
}

export function withCompanyNames(users = [], companies = []) {
  const names = companyNameById(companies);
  return users.map((user) => ({
    ...user,
    companyName: user.companyName || names[String(user.companyId)] || '',
  }));
}

function matchesSearch(user, query) {
  if (!query) return true;
  return [user.fullName, user.username, user.role, user.companyName]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}

function matchesStatusFilter(user, filter) {
  if (filter === 'unconfigured') return !user.moduleAccessCustom;
  if (filter === 'custom') return !!user.moduleAccessCustom;
  if (filter === 'new') return isNewModuleAccessUser(user);
  return true;
}

function compareNewestFirst(a, b) {
  const createdA = parseCreatedAt(a.createdAt) || 0;
  const createdB = parseCreatedAt(b.createdAt) || 0;
  if (createdA !== createdB) return createdB - createdA;
  if (a.moduleAccessCustom !== b.moduleAccessCustom) {
    return a.moduleAccessCustom ? 1 : -1;
  }
  return String(a.fullName || '').localeCompare(String(b.fullName || ''));
}

export function filterModuleAccessUsers(users, { companyId, search, filter } = {}) {
  const query = String(search || '').trim().toLowerCase();
  const companyKey = companyId ? String(companyId) : '';

  return users
    .filter((user) => !companyKey || String(user.companyId) === companyKey)
    .filter((user) => matchesSearch(user, query))
    .filter((user) => matchesStatusFilter(user, filter))
    .slice()
    .sort(compareNewestFirst);
}
