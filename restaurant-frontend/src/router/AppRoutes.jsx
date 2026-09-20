import { Navigate, Route, Routes } from 'react-router-dom';
import { restaurantRoutes } from '../restaurant/app/RestaurantRoutes';
import LoginPage from '../features/auth/pages/LoginPage';
import AuthAcceptPage from '../features/auth/pages/AuthAcceptPage';
import ProtectedRoute from './guards/ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/accept" element={<AuthAcceptPage />} />
      {restaurantRoutes}
      <Route
        path="*"
        element={(
          <ProtectedRoute>
            <Navigate to="/rst/pos" replace />
          </ProtectedRoute>
        )}
      />
    </Routes>
  );
}
