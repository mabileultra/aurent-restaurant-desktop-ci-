import { api } from './client';

/** Tenant billing only — platform billing stays on main app. */
export const tenantBillingApi = {
  me: () => api.get('/billing/me'),
  access: () => api.get('/billing/me/access'),
  plans: () => api.get('/billing/plans'),
  ledger: (params) => api.get('/billing/me/ledger', { params }),
  topUps: (params) => api.get('/billing/me/top-ups', { params }),
  submitTopUp: ({ amount, comment, file }) => {
    const fd = new FormData();
    fd.append('amount', String(amount));
    if (comment) fd.append('comment', comment);
    if (file) fd.append('file', file, file.name || 'receipt.bin');
    return api.post('/billing/me/top-ups', fd, { timeout: 60000 });
  },
  createPayment: (payload) => api.post('/billing/me/payments', payload),
  payments: (params) => api.get('/billing/me/payments', { params }),
  payment: (id) => api.get(`/billing/me/payments/${id}`),
  ledgerEntry: (id) => api.get(`/billing/me/ledger/${id}`),
  deleteLedgerEntry: (id) => api.delete(`/billing/me/ledger/${id}`),
  deleteLedgerEntries: (ids) => api.post('/billing/me/ledger/bulk-delete', { ids }),
  deleteAllLedger: () => api.delete('/billing/me/ledger'),
};
