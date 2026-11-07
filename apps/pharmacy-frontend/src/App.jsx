import { BrowserRouter } from 'react-router-dom';
import TenantDisplayBootstrap from './components/shared/TenantDisplayBootstrap';
import { PharmacyRoutes } from './pharmacy/app/PharmacyRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <TenantDisplayBootstrap>
        <PharmacyRoutes />
      </TenantDisplayBootstrap>
    </BrowserRouter>
  );
}
