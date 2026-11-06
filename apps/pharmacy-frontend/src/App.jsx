import { BrowserRouter } from 'react-router-dom';
import { PharmacyRoutes } from './pharmacy/app/PharmacyRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <PharmacyRoutes />
    </BrowserRouter>
  );
}
