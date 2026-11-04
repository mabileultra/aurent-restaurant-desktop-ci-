/**
 * @aurent/shared-auth — cross-SPA Identity handoff (one-time code, no JWT in URL).
 * Vertical login screens and path maps stay in each app.
 */
export { HANDOFF_AUDIENCE } from './audiences.js';
export { safeNextPath } from './safeNextPath.js';
export { readHandoffCodeFromSearch, clearHandoffCodeFromUrl } from './handoffCode.js';
export { buildHandoffAcceptUrl } from './buildHandoffAcceptUrl.js';
export { createHandoff, exchangeHandoff } from './handoffApi.js';
