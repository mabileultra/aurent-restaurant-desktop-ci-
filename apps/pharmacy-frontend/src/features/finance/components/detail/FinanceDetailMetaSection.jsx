import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import FinanceDetailFieldGrid from './FinanceDetailFieldGrid';

export default function FinanceDetailMetaSection({ title, children }) {
  const [open, setOpen] = useState(false);
  const items = useMemo(
    () => (Array.isArray(children) ? children : [children]).filter(Boolean),
    [children],
  );

  if (items.length === 0) return null;

  return (
    <section className="finance-detail-modal__meta-section">
      <button
        type="button"
        className={`finance-detail-modal__meta-toggle ${open ? 'finance-detail-modal__meta-toggle--open' : ''}`.trim()}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown size={18} aria-hidden />
      </button>
      {open ? (
        <FinanceDetailFieldGrid className="finance-detail-modal__grid--meta">
          {items}
        </FinanceDetailFieldGrid>
      ) : null}
    </section>
  );
}
