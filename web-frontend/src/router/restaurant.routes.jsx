import { Route } from 'react-router-dom';
import RestaurantAuthGuard from './guards/RestaurantAuthGuard';
import RestaurantSpaHandoff from './guards/RestaurantSpaHandoff';

/**
 * Thin /rst mount on aurent: auth + handoff to r-aurent.
 * Legacy restaurant UI lived under src/restaurant — removed; source of truth is restaurant-frontend.
 */
export const restaurantRoutes = (
  <Route
    path="/rst/*"
    element={(
      <RestaurantAuthGuard>
        <RestaurantSpaHandoff />
      </RestaurantAuthGuard>
    )}
  />
);
