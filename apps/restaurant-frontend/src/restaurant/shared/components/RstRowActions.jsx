import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import RstRowMenu from './RstRowMenu';

/** Table/card actions: ⋯ trigger + shared overflow menu. */
export default function RstRowActions({ t, items, label }) {
  const [rect, setRect] = useState(null);
  const list = (items ?? []).filter(Boolean);

  if (!list.length) return null;

  return (
    <div className="rst-row-actions">
      <button
        type="button"
        className="rst-row-actions__trigger"
        aria-label={label || t('common.actions')}
        aria-expanded={Boolean(rect)}
        onClick={(e) => {
          e.stopPropagation();
          const next = e.currentTarget.getBoundingClientRect();
          setRect((cur) => (cur ? null : next));
        }}
      >
        <MoreVertical size={16} />
      </button>
      <RstRowMenu
        rect={rect}
        items={list}
        t={t}
        onClose={() => setRect(null)}
      />
    </div>
  );
}
