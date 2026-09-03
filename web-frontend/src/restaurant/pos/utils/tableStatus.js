export const TABLE_STATUSES = [
  'FREE',
  'OCCUPIED',
  'RESERVED',
  'WAITING_PAYMENT',
  'CLEANING',
  'BLOCKED',
];

export const MANUAL_TABLE_STATUSES = ['FREE', 'RESERVED', 'CLEANING', 'BLOCKED'];

export function tableStatusClass(status) {
  return TABLE_STATUSES.includes(status) ? status : 'FREE';
}
