import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import ThemedToaster from './components/shared/ThemedToaster';
import GlobalOfflineBanner from './components/shared/GlobalOfflineBanner';
import VirtualKeyboardOverlay from './components/shared/VirtualKeyboardOverlay';
import HtmlLangSync from './components/shared/HtmlLangSync';
import AppViewportSync from './components/shared/AppViewportSync';
import AdminThemeSync from './components/shared/AdminThemeSync';
import AuthBootstrap from './components/shared/AuthBootstrap';
import AuthSessionGuard from './components/shared/AuthSessionGuard';
import DesktopApiBootstrap from './components/shared/DesktopApiBootstrap';
import TenantDisplayBootstrap from './components/shared/TenantDisplayBootstrap';
import UnitsCatalogBootstrap from './components/shared/UnitsCatalogBootstrap';
import AppRoutes from './router/AppRoutes';
import MainWorldGate from './router/guards/MainWorldGate';
import ObservabilityErrorBoundary from './observability/ObservabilityErrorBoundary';

export default function App() {
  return (
    <ObservabilityErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HtmlLangSync />
      <AppViewportSync />
      <BrowserRouter>
        <AuthBootstrap>
          <AuthSessionGuard>
          <DesktopApiBootstrap>
            <TenantDisplayBootstrap>
              <UnitsCatalogBootstrap>
                <AdminThemeSync />
                <MainWorldGate>
                  <AppRoutes />
                </MainWorldGate>
              </UnitsCatalogBootstrap>
            </TenantDisplayBootstrap>
          </DesktopApiBootstrap>
          </AuthSessionGuard>
        </AuthBootstrap>
      </BrowserRouter>
      <GlobalOfflineBanner />
      <ThemedToaster />
      <VirtualKeyboardOverlay />
    </QueryClientProvider>
    </ObservabilityErrorBoundary>
  );
}
