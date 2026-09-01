import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/pharmacy-integration-more.css';

export default function PharmacyIntegrationMoreMenu({
  open,
  links,
  onSelect,
  onClose,
}) {
  const { t } = useTranslation();
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={rootRef} className="pharmacy-integration-more">
      <ul className="pharmacy-integration-more__list" role="menu">
        {links.map((link) => (
          <li key={link.id} role="none">
            <button
              type="button"
              role="menuitem"
              className="pharmacy-integration-more__item"
              onClick={() => onSelect(link)}
            >
              {t(`pharmacyCashier.integrations.links.${link.id}`)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
