import { useEffect, useRef, useState } from 'react';
import { Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PlatformFilterMenu({ options = [], value = '', onChange, label }) {
  const { t } = useTranslation();
  const caption = t('platform.toolbarFilter', { defaultValue: 'Фильтр' });
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const active = Boolean(value);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!options.length) return null;

  return (
    <div className="platform-filter-bar__menu" ref={rootRef}>
      <button
        type="button"
        className={`platform-filter-bar__filter${active ? ' is-active' : ''}`}
        aria-expanded={open}
        aria-label={label || caption}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{caption}</span>
        <span className="platform-filter-bar__filter-icon">
          <Filter size={15} strokeWidth={2.2} aria-hidden />
          {active ? <span className="platform-filter-bar__dot" /> : null}
        </span>
      </button>
      {open ? (
        <div className="platform-filter-bar__dropdown" role="menu">
          {options.map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              role="menuitem"
              className={`platform-filter-bar__option${value === option.value ? ' is-active' : ''}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
