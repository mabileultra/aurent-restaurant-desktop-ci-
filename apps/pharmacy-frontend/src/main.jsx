import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './i18n/config';
import App from './App.jsx';
import { queryClient } from './lib/queryClient';
import './index.css';
import './styles/shared/toaster.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="top-center" containerClassName="app-toaster" />
    </QueryClientProvider>
  </React.StrictMode>,
);
