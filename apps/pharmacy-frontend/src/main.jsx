import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import '@fontsource-variable/inter';
import './i18n/config';
import App from './App.jsx';
import { queryClient } from './lib/queryClient';
import { syncRootTheme } from './store/themeStore';
import './index.css';
import './styles/shared/toaster.css';

syncRootTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-center"
        containerClassName="app-toaster"
        toastOptions={{
          className: 'ui-toast',
          style: {
            background: 'rgb(var(--color-surface))',
            color: 'rgb(var(--color-ink))',
            border: '1px solid rgb(var(--color-line))',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-elevated)',
          },
          success: {
            iconTheme: {
              primary: '#16A34A',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#E5484D',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
);
