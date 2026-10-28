/**
 * 2000 concurrent cashiers — peak click burst on POS read APIs.
 *
 * One VU ≈ one open касса/официант at peak (зал + меню + смена + roster).
 * No POST/pay/order create.
 *
 *   k6 run scripts/loadtest/k6-cashiers-2k.js \
 *     -e BASE_URL=http://127.0.0.1:8080/api/v1 \
 *     -e TOKEN=… -e STORE_ID=68
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const failRate = new Rate('cashier_tick_fail');
const tickMs = new Trend('cashier_tick_ms', true);

const baseUrl = (__ENV.BASE_URL || 'http://127.0.0.1:8080/api/v1').replace(/\/$/, '');
const token = __ENV.TOKEN || '';
const storeId = __ENV.STORE_ID || '';
const holdVu = Number(__ENV.CASHIERS || 2000);
const holdSec = __ENV.HOLD || '90s';

export const options = {
  stages: [
    { duration: '20s', target: Math.min(200, holdVu) },
    { duration: '30s', target: Math.min(800, holdVu) },
    { duration: '40s', target: holdVu },
    { duration: holdSec, target: holdVu },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(95)<5000'],
    cashier_tick_fail: ['rate<0.12'],
    cashier_tick_ms: ['p(95)<8000'],
  },
};

function headers() {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
}

export function setup() {
  if (!token || !storeId) {
    throw new Error('Set TOKEN and STORE_ID');
  }
  const h = headers();
  const probe = http.get(`${baseUrl}/rst/stores/${storeId}/floor-revision`, { headers: h });
  if (probe.status !== 200) {
    throw new Error(`auth/store probe failed: HTTP ${probe.status}`);
  }
  return { storeId };
}

/** Peak UI open / aggressive refresh — all read APIs the floor POS needs. */
export default function (data) {
  const sid = data.storeId;
  const h = headers();
  const t0 = Date.now();

  const responses = http.batch([
    ['GET', `${baseUrl}/rst/stores/${sid}/floor-revision`, null, { headers: h, tags: { name: 'floor_revision' } }],
    ['GET', `${baseUrl}/rst/stores/${sid}/floor`, null, { headers: h, tags: { name: 'floor' } }],
    ['GET', `${baseUrl}/rst/stores/${sid}/menu-items?posOnly=true`, null, { headers: h, tags: { name: 'menu' } }],
    ['GET', `${baseUrl}/rst/stores/${sid}/menu-categories?activeOnly=true`, null, { headers: h, tags: { name: 'menu_categories' } }],
    ['GET', `${baseUrl}/rst/stores/${sid}/shifts/current`, null, { headers: h, tags: { name: 'shift' } }],
    ['GET', `${baseUrl}/rst/stores/${sid}/orders/active`, null, { headers: h, tags: { name: 'orders_active' } }],
    ['GET', `${baseUrl}/rst/stores/${sid}/kitchen-board`, null, { headers: h, tags: { name: 'kitchen_board' } }],
    ['GET', `${baseUrl}/users/pos-roster?storeId=${sid}`, null, { headers: h, tags: { name: 'pos_roster' } }],
  ]);

  let ok = true;
  for (const res of responses) {
    // shift current may be 204 when no open shift
    const pass = check(res, {
      'ok status': (r) => r.status === 200 || r.status === 204,
    });
    if (!pass) ok = false;
  }

  failRate.add(!ok);
  tickMs.add(Date.now() - t0);
  // ~revision poll cadence under load (click burst, then short pause)
  sleep(Number(__ENV.THINK || 2));
}
