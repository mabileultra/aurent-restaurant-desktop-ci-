/** Placeholder until restaurant settings expose ticket SLA. */
export const DASHBOARD_KITCHEN_SLOW_MINUTES = 15;

export function isKitchenTicketSlow(ageMinutes, threshold = DASHBOARD_KITCHEN_SLOW_MINUTES) {
  return Number(ageMinutes) >= Number(threshold);
}
