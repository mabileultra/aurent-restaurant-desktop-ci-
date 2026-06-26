export function computeHallTableStats(tables = []) {
  return {
    total: tables.length,
    occupied: tables.filter((t) => t.status === 'OCCUPIED').length,
    free: tables.filter((t) => t.status === 'FREE').length,
    reserved: tables.filter((t) => t.status === 'RESERVED').length,
  };
}
