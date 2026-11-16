import { BrowserRouter } from 'react-router-dom';
import AdminThemeSync from './components/shared/AdminThemeSync';
import GlobalOfflineBanner from './components/shared/GlobalOfflineBanner';
import HtmlLangSync from './components/shared/HtmlLangSync';
import TenantDisplayBootstrap from './components/shared/TenantDisplayBootstrap';
import VirtualKeyboardOverlay from './components/shared/VirtualKeyboardOverlay';
import { PharmacyRoutes } from './pharmacy/app/PharmacyRoutes';

export default function App() {
  return (
    <>
      <HtmlLangSync />
      <BrowserRouter>
        <TenantDisplayBootstrap>
          <AdminThemeSync />
          <PharmacyRoutes />
        </TenantDisplayBootstrap>
      </BrowserRouter>
      <GlobalOfflineBanner />
      <VirtualKeyboardOverlay />
    </>
  );
}
