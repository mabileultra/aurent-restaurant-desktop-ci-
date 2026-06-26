export function computeBookingStats(reservations = []) {
  return {
    pending: reservations.filter((r) => r.status === 'PENDING').length,
    confirmed: reservations.filter((r) => r.status === 'CONFIRMED').length,
    seated: reservations.filter((r) => r.status === 'SEATED').length,
    cancelled: reservations.filter((r) => r.status === 'CANCELLED' || r.status === 'NO_SHOW').length,
  };
}
