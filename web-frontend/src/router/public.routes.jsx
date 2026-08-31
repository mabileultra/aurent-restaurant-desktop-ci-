import { Route, Navigate } from 'react-router-dom';
import AuthRoute from './guards/AuthRoute';
import {
  LoginPage,
  CashierPinLoginPage,
  DesktopInstallerPage,
  ReceiptPage,
  PublicHomePage,
  PublicAboutPage,
  PublicPricingPage,
  PublicEquipmentPage,
  ContactsPage,
} from './lazyPages';

export const publicRoutes = (
  <>
    <Route path="/" element={<PublicHomePage />} />
    <Route path="/about" element={<PublicAboutPage />} />
    <Route path="/pricing" element={<PublicPricingPage />} />
    <Route path="/equipment" element={<PublicEquipmentPage />} />
    <Route path="/contacts" element={<ContactsPage />} />
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
