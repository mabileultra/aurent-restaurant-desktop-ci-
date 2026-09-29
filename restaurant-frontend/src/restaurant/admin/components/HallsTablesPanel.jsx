import { BaseButton } from '../../../components/ui';
import RstRowActions from '../../shared/components/RstRowActions';
import { useInfiniteScrollSlice } from '../../shared/hooks/useInfiniteScrollSlice';
import '../styles/halls-admin.css';

const TABLES_LIST_PAGE_SIZE = 20;

function serviceMark(table, hallServicePercent, t) {
  const own = table.servicePercent != null && table.servicePercent !== '';
  const percent = own ? Number(table.servicePercent) : Number(hallServicePercent) || 0;
  if (!(percent > 0)) return '';
  const shown = Number.isInteger(percent) ? String(percent) : String(percent);
  return own
    ? t('rst.admin.serviceOwnShort', { percent: shown })
    : t('rst.admin.serviceHallShort', { percent: shown });
}

export default function HallsTablesPanel({
  tables,
  hallId,
  hallServicePercent = 0,
  onAddTable,
  onEditTable,
  onDeactivateTable,
  t,
}) {
  const {
    visibleItems: visibleTables,
    hasMore: hasMoreTables,
    rootRef: tableListRef,
    sentinelRef: tableSentinelRef,
  } = useInfiniteScrollSlice(tables, {
    pageSize: TABLES_LIST_PAGE_SIZE,
    resetKey: hallId,
    rootMargin: '80px',
  });

  return (
    <div className="rst-halls__pane rst-halls__pane--list">
      <div className="rst-halls__pane-head">
        <div>
          <strong>{t('rst.admin.tablesList')}</strong>
          <span>
            {visibleTables.length}
            {hasMoreTables ? ` / ${tables.length}` : ` · ${tables.length}`}
          </span>
        </div>
        {onAddTable ? (
          <BaseButton type="button" size="sm" onClick={onAddTable}>
            {t('rst.admin.addTable')}
          </BaseButton>
        ) : null}
      </div>

      <div ref={tableListRef} className="rst-halls__pane-body rst-halls__table-list">
        {tables.length === 0 ? (
          <div className="rst-halls__empty">
            <p>{t('rst.floor.noTables')}</p>
            {onAddTable ? (
              <BaseButton type="button" onClick={onAddTable}>
                {t('rst.admin.addTable')}
              </BaseButton>
            ) : null}
          </div>
        ) : (
          <>
            {visibleTables.map((table) => {
              const mark = serviceMark(table, hallServicePercent, t);
              return (
              <div key={table.id} className="rst-halls__row">
                <button
                  type="button"
                  className="rst-halls__row-main"
                  onClick={() => onEditTable?.(table)}
                >
                  <strong>{table.code}</strong>
                  <span className="rst-halls__row-meta">
                    {table.label ? `${table.label} · ` : ''}
                    {t(`rst.status.${table.status}`)} · {t('rst.floor.seats', { count: table.seatCount })}
                    {mark ? ` · ${mark}` : ''}
                  </span>
                </button>
                <RstRowActions
                  t={t}
                  items={[
                    {
                      key: 'edit',
                      label: t('common.edit'),
                      onClick: () => onEditTable?.(table),
                    },
                    {
                      key: 'delete',
                      label: t('common.delete'),
                      danger: true,
                      onClick: () => {
                        if (window.confirm(t('rst.admin.confirmDeactivateTable'))) {
                          onDeactivateTable?.(table.id);
                        }
                      },
                    },
                  ]}
                />
              </div>
              );
            })}
            {hasMoreTables ? (
              <div ref={tableSentinelRef} className="rst-halls__scroll-sentinel" aria-hidden>
                {t('rst.admin.loadingMore')}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
