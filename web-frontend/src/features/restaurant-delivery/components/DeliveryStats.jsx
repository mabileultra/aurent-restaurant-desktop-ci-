import { CheckCircle2, Package, ShoppingBag, Truck } from 'lucide-react';
import RestaurantStatCard from '../../restaurant-shared/components/RestaurantStatCard';
import RestaurantStatGrid from '../../restaurant-shared/components/RestaurantStatGrid';
import { computeDeliveryStats } from '../utils/deliveryStats';

export default function DeliveryStats({ rows, total, t }) {
  const stats = computeDeliveryStats(rows);

  return (
    <RestaurantStatGrid>
      <RestaurantStatCard icon={ShoppingBag} value={total} label={t('restaurantDelivery.statTotal')} tone="emerald" />
      <RestaurantStatCard icon={Package} value={stats.newOrders} label={t('restaurantDelivery.statNew')} tone="amber" />
      <RestaurantStatCard icon={Truck} value={stats.delivered} label={t('restaurantDelivery.statDelivered')} tone="blue" />
      <RestaurantStatCard icon={CheckCircle2} value={stats.completed} label={t('restaurantDelivery.statCompleted')} tone="violet" />
    </RestaurantStatGrid>
  );
}
