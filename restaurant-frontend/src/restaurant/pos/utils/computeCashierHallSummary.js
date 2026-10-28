import { collectHallTables, ALL_HALLS_ID, countHallTableStats } from './floorStatusFilters';
import { resolveTableChecksTotal } from './restaurantPayAmount';
import { round2 } from '../../../utils/taxAmounts';

/**
 * Live hall strip for cashier hardware bar: occupied tables + open-check sum.
 */
export function computeCashierHallSummary(halls = []) {
  const tables = collectHallTables(halls, ALL_HALLS_ID);
  const stats = countHallTableStats(tables);
  const occupied = (stats.occupied || 0) + (stats.waiting || 0);

  let openSum = 0;
  for (const table of tables) {
    if (table.status !== 'OCCUPIED' && table.status !== 'WAITING_PAYMENT') continue;
    const amount = resolveTableChecksTotal(table, halls);
    if (amount != null) openSum += amount;
  }

  return {
    occupied,
    waiting: stats.waiting || 0,
    openSum: round2(openSum),
  };
}
