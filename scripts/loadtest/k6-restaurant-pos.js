/**
 * Restaurant POS peak: menu + floor + categories (read path = cashier/waiter UI ticks).
 *
 * Does NOT create orders/payments — safe for staging under load.
 *
 * Install: https://k6.io  (brew install k6)
 *
 * Smoke (local):
 *   k6 run scripts/loadtest/k6-restaurant-pos.js \
 *     -e BASE_URL=http://127.0.0.1:8080/api/v1 \
 *     -e TOKEN=eyJ... -e STORE_ID=59 -e PROFILE=smoke
 *
 * Peak ~10k iterations (≈100 VU × 100s of traffic):
 *   k6 run scripts/loadtest/k6-restaurant-pos.js \
 *     -e BASE_URL=https://staging.example/api/v1 \
 *     -e TOKEN=... -e STORE_ID=59 -e PROFILE=peak10k
 *
 * Never point PROFILE=peak10k at production without ops approval.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const failRate = new Rate('rst_tick_fail');
const tickDuration = new Trend('rst_tick_ms', true);

const baseUrl = (__ENV.BASE_URL || 'http://127.0.0.1:8080/api/v1').replace(/\/$/, '');
const token = __ENV.TOKEN || '';
const storeId = __ENV.STORE_ID || '';
const profile = (__ENV.PROFILE || 'smoke').toLowerCase();

const profiles = {
  smoke: {
    stages: [
      { duration: '15s', target: 5 },
      { duration: '30s', target: 10 },
      { duration: '15s', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.05'],
      http_req_duration: ['p(95)<1500'],
      rst_tick_fail: ['rate<0.05'],
      rst_tick_ms: ['p(95)<2000'],
    },
  },
  /** ~concurrent cashiers/waiters peeking menu+floor */
  peak: {
    stages: [
      { duration: '30s', target: 50 },
      { duration: '2m', target: 100 },
      { duration: '1m', target: 150 },
      { duration: '30s', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.08'],
      http_req_duration: ['p(95)<2500'],
      rst_tick_fail: ['rate<0.1'],
      rst_tick_ms: ['p(95)<4000'],
    },
  },
  /** Aggressive 10k-class peak (high VU) */
  peak10k: {
    stages: [
      { duration: '1m', target: 200 },
      { duration: '3m', target: 500 },
      { duration: '2m', target: 800 },
      { duration: '1m', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.1'],
      http_req_duration: ['p(95)<4000'],
      rst_tick_fail: ['rate<0.12'],
      rst_tick_ms: ['p(95)<6000'],
    },
  },
};

const cfg = profiles[profile] || profiles.smoke;

export const options = {
  stages: cfg.stages,
  thresholds: cfg.thresholds,
};

function authHeaders() {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
}

export function setup() {
  if (!token || !storeId) {
    throw new Error('Set TOKEN and STORE_ID env vars');
  }
  const health = http.get(`${baseUrl}/actuator/health`);
  check(health, { 'gateway health reachable': (r) => r.status === 200 || r.status === 404 });
  return { storeId };
}

/**
 * One UI "tick" ≈ what cashier/waiter polls while idle on hall/menu.
 */
export default function (data) {
  const sid = data.storeId;
  const headers = authHeaders();
  const started = Date.now();

  const responses = http.batch([
    ['GET', `${baseUrl}/rst/stores/${sid}/menu-items?posOnly=true`, null, { headers, tags: { name: 'menu' } }],
    ['GET', `${baseUrl}/rst/stores/${sid}/menu-categories?activeOnly=true`, null, { headers, tags: { name: 'menu_categories' } }],
    ['GET', `${baseUrl}/rst/stores/${sid}/floor-revision`, null, { headers, tags: { name: 'floor_revision' } }],
    ['GET', `${baseUrl}/rst/stores/${sid}/floor`, null, { headers, tags: { name: 'floor' } }],
  ]);

  let ok = true;
  for (const res of responses) {
    const pass = check(res, {
      'status 200': (r) => r.status === 200,
    });
    if (!pass) ok = false;
  }

  failRate.add(!ok);
  tickDuration.add(Date.now() - started);

  // Think time: real cashiers don't hammer every ms
  sleep(profile === 'peak10k' ? 0.15 : 0.35);
}
