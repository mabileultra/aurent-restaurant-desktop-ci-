import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n/config';
import App from './App.jsx';
import './index.css';
import { syncRestaurantTheme } from './store/themeStore';
import { registerRestaurantPwa } from './restaurant/pos/waiter-mobile/utils/registerRestaurantPwa';

syncRestaurantTheme();
registerRestaurantPwa();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
