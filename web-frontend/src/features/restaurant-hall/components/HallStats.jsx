import { Armchair, CalendarClock, LayoutGrid, Users } from 'lucide-react';
import RestaurantStatCard from '../../restaurant-shared/components/RestaurantStatCard';
import RestaurantStatGrid from '../../restaurant-shared/components/RestaurantStatGrid';
import { computeHallTableStats } from '../utils/hallTableStats';

export default function HallStats({ tables, t }) {
  const stats = computeHallTableStats(tables);

  return (
    <RestaurantStatGrid>
      <RestaurantStatCard
        icon={LayoutGrid}
        value={stats.total}
        label={t('restaurantHall.statTotal')}
        tone="emerald"
      />
      <RestaurantStatCard
        icon={Users}
        value={stats.occupied}
        label={t('restaurantHall.statOccupied')}
        tone="blue"
      />
      <RestaurantStatCard
        icon={Armchair}
        value={stats.free}
        label={t('restaurantHall.statFree')}
        tone="amber"
      />
      <RestaurantStatCard
        icon={CalendarClock}
        value={stats.reserved}
        label={t('restaurantHall.statReserved')}
        tone="violet"
      />
    </RestaurantStatGrid>
  );
}
