import { useEffect, useMemo, useState } from 'react';
import { BaseButton } from '../../../components/ui';
import RstModal from '../../shared/components/RstModal';
import FloorCanvas from './FloorCanvas';
import { ALL_HALLS_ID } from '../utils/floorStatusFilters';
import '../styles/waiter-hall-pick.css';

/**
 * Hall schema picker: free = green (take), occupied = red + waiter name.
 */
export default function WaiterHallPickModal({
  open,
  halls = [],
  selectedHallId,
  waiterNameById,
  onClose,
  onPickFree,
  t,
}) {
  const realHalls = useMemo(
    () => (halls ?? []).filter((hall) => hall?.id != null),
    [halls],
  );

  const [hallId, setHallId] = useState(null);

  useEffect(() => {
    if (!open) return;
    const preferred = selectedHallId !== ALL_HALLS_ID && selectedHallId != null
      ? selectedHallId
      : realHalls[0]?.id ?? null;
    setHallId(preferred);
  }, [open, selectedHallId, realHalls]);

  const activeHallId = realHalls.some((h) => h.id === hallId)
    ? hallId
    : realHalls[0]?.id ?? null;
  const hall = realHalls.find((row) => row.id === activeHallId) ?? null;

  return (
    <RstModal
      open={open}
      title={t('rst.floor.pickTableTitle')}
      onClose={onClose}
      size="xl"
      footer={(
        <BaseButton type="button" variant="ghost" onClick={onClose}>
          {t('common.close')}
        </BaseButton>
      )}
    >
      <p className="rst-waiter-pick__hint">{t('rst.floor.pickTableHint')}</p>
      {realHalls.length > 1 ? (
        <div className="rst-waiter-pick__halls" role="tablist">
          {realHalls.map((row) => (
            <button
              key={row.id}
              type="button"
              role="tab"
              aria-selected={row.id === activeHallId}
              className={`rst-waiter-pick__hall${row.id === activeHallId ? ' is-active' : ''}`}
              onClick={() => setHallId(row.id)}
            >
              {row.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="rst-waiter-pick__canvas">
        <FloorCanvas
          variant="pick"
          hall={hall}
          waiterNameById={waiterNameById}
          onTableClick={(table) => {
            const status = String(table.status || '').toUpperCase();
            if (status === 'FREE' || status === 'CLEANING') {
              onPickFree?.(table);
            }
          }}
          t={t}
        />
      </div>
    </RstModal>
  );
}
