import { Link } from 'react-router-dom';

export default function StockProductsFilterLinks({ links, onNavigate }) {
  if (!links?.length) return null;

  return (
    <nav className="rst-stock-filters__links" aria-label="stock">
      {links.map((link) => (
        <Link key={link.to} to={link.to} onClick={onNavigate}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
