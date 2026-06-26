import { CalendarClock, CheckCircle2, UserCheck, UserX } from 'lucide-react';
import RestaurantStatCard from '../../restaurant-shared/components/RestaurantStatCard';
import RestaurantStatGrid from '../../restaurant-shared/components/RestaurantStatGrid';
import { computeBookingStats } from '../utils/bookingStats';

export default function BookingStats({ reservations, t }) {
  const stats = computeBookingStats(reservations);

  return (
    <RestaurantStatGrid>
      <RestaurantStatCard icon={CalendarClock} value={stats.pending} label={t('restaurantBooking.statPending')} tone="amber" />
      <RestaurantStatCard icon={CheckCircle2} value={stats.confirmed} label={t('restaurantBooking.statConfirmed')} tone="blue" />
      <RestaurantStatCard icon={UserCheck} value={stats.seated} label={t('restaurantBooking.statSeated')} tone="emerald" />
      <RestaurantStatCard icon={UserX} value={stats.cancelled} label={t('restaurantBooking.statCancelled')} tone="violet" />
    </RestaurantStatGrid>
  );
}
