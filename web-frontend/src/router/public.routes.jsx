import { Route, Navigate } from 'react-router-dom';
import AuthRoute from './guards/AuthRoute';
import {
  LoginPage,
  CashierPinLoginPage,
  DesktopInstallerPage,
  ReceiptPage,
  PublicHomePage,
} from './lazyPages';

export const publicRoutes = (
  <>
    <Route path="/" element={<PublicHomePage />} />
    <Route path="/about" element={<Navigate to={{ pathname: '/', hash: '#about' }} replace />} />
    <Route path="/pricing" element={<Navigate to={{ pathname: '/', hash: '#pricing' }} replace />} />
    <Route path="/equipment" element={<Navigate to={{ pathname: '/', hash: '#equipment' }} replace />} />
    <Route path="/contacts" element={<Navigate to={{ pathname: '/', hash: '#contacts' }} replace />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/cashier/login" element={<CashierPinLoginPage />} />
    <Route path="/install" element={<DesktopInstallerPage />} />
    <Route
      path="/receipt/:receiptNumber"
      element={(
        <AuthRoute>
          <ReceiptPage />
        </AuthRoute>
      )}
    />
  </>
);
