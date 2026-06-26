import { ChefHat, Clock3, Flame, UtensilsCrossed } from 'lucide-react';
import RestaurantStatCard from '../../restaurant-shared/components/RestaurantStatCard';
import RestaurantStatGrid from '../../restaurant-shared/components/RestaurantStatGrid';
import { computeKitchenStats } from '../utils/kitchenStats';

export default function KitchenStats({ tickets, t }) {
  const stats = computeKitchenStats(tickets);

  return (
    <RestaurantStatGrid>
      <RestaurantStatCard icon={UtensilsCrossed} value={stats.total} label={t('restaurantKitchen.statTotal')} tone="emerald" />
      <RestaurantStatCard icon={Clock3} value={stats.pending} label={t('restaurantKitchen.statPending')} tone="amber" />
      <RestaurantStatCard icon={Flame} value={stats.inProgress} label={t('restaurantKitchen.statInProgress')} tone="blue" />
      <RestaurantStatCard icon={ChefHat} value={stats.ready} label={t('restaurantKitchen.statReady')} tone="violet" />
    </RestaurantStatGrid>
  );
}
