import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import RouteFallback from './RouteFallback';
import AppFallbackRedirect from './guards/AppFallbackRedirect';
import { restaurantRoutes } from './restaurant.routes';
import { pharmacyRoutes } from '../pharmacy/app/PharmacyRoutes';
import { publicRoutes } from './public.routes';
import { cashierRoutes } from './cashier.routes';
import { platformRoutes } from './platform.routes';
import { adminRoutes } from './admin.routes';

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {publicRoutes}
        {restaurantRoutes}
        {pharmacyRoutes}
        {cashierRoutes}
        {platformRoutes}
        {adminRoutes}
        <Route path="*" element={<AppFallbackRedirect />} />
      </Routes>
    </Suspense>
  );
}
