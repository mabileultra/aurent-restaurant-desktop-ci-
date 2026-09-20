import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import ThemedToaster from './components/shared/ThemedToaster';
import HtmlLangSync from './components/shared/HtmlLangSync';
import AdminThemeSync from './components/shared/AdminThemeSync';
import AppViewportSync from './components/shared/AppViewportSync';
import AuthBootstrap from './components/shared/AuthBootstrap';
import AuthSessionGuard from './components/shared/AuthSessionGuard';
import AppRoutes from './router/AppRoutes';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HtmlLangSync />
      <AppViewportSync />
      <BrowserRouter>
        <AuthBootstrap>
          <AuthSessionGuard>
            <AdminThemeSync />
            <AppRoutes />
          </AuthSessionGuard>
        </AuthBootstrap>
      </BrowserRouter>
      <ThemedToaster />
    </QueryClientProvider>
  );
}
