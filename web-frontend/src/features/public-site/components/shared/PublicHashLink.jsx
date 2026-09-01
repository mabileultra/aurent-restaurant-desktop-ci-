import { Link, useLocation } from 'react-router-dom';
import { scrollToPublicSection } from '../../hooks/usePublicHashScroll';

export default function PublicHashLink({ to, className, children, onClick }) {
  const location = useLocation();
  const hash = to.startsWith('#') ? to : `#${to}`;

  const handleClick = (event) => {
    if (location.pathname === '/') {
      event.preventDefault();
      scrollToPublicSection(hash);
      window.history.replaceState(null, '', hash === '#top' ? '/' : `/${hash}`);
    }
    onClick?.(event);
  };

  if (location.pathname === '/') {
    return (
      <a href={hash} className={className} onClick={handleClick}>
        {children}
      </a>
    );
  }

  return (
    <Link to={{ pathname: '/', hash }} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
