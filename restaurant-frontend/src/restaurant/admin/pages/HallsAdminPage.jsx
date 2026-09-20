import { BaseButton } from '../../../components/ui';
import FloorHallTabs from '../../pos/components/FloorHallTabs';
import FloorCanvas from '../../pos/components/FloorCanvas';
import FloorStatusLegend from '../../pos/components/FloorStatusLegend';
import HallFormModal from '../components/HallFormModal';
import TableFormModal from '../components/TableFormModal';
import { useHallsAdminPage } from '../hooks/useHallsAdminPage';
import { useInfiniteScrollSlice } from '../../shared/hooks/useInfiniteScrollSlice';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';

const TABLES_LIST_PAGE_SIZE = 20;

export default function HallsAdminPage() {
  const p = useHallsAdminPage();
  const tables = p.selectedHall?.tables ?? [];
  const {
    visibleItems: visibleTables,
    hasMore: hasMoreTables,
    rootRef: tableListRef,
    sentinelRef: tableSentinelRef,
  } = useInfiniteScrollSlice(tables, {
    pageSize: TABLES_LIST_PAGE_SIZE,
    resetKey: p.selectedHall?.id,
    rootMargin: '80px',
  });

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section>
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.hallsTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.hallsSubtitle')}</p>
        </div>
        <div className="rst-halls__actions">
          <BaseButton type="button" onClick={() => p.setHallModal({ mode: 'create', form: p.emptyHallForm() })}>
            {p.t('rst.admin.addHall')}
          </BaseButton>
          {p.selectedHall ? (
            <>
              <BaseButton
                type="button"
                variant="ghost"
                onClick={() => p.setHallModal({
                  mode: 'edit',
                  form: { id: p.selectedHall.id, name: p.selectedHall.name, sortOrder: p.selectedHall.sortOrder },
                })}
              >
                {p.t('rst.admin.editHall')}
              </BaseButton>
              <BaseButton
                type="button"
                variant="ghost"
                onClick={() => p.setTableModal({ mode: 'create', form: p.nextTableForm(p.selectedHall.tables) })}
              >
                {p.t('rst.admin.addTable')}
              </BaseButton>
              <BaseButton type="button" variant="ghost" onClick={() => p.arrangeMutation.mutate()}>
                {p.t('rst.admin.arrangeTables')}
              </BaseButton>
            </>
          ) : null}
        </div>
      </div>

      {p.workspace.canPickStore ? (
        <label className="rst-shell__store d-block mb-3">
          <span className="d-block mb-1 small">{p.t('rst.admin.selectStore')}</span>
          <select
            className="form-select"
            value={p.workspace.pickedStoreId}
            onChange={(e) => p.workspace.setPickedStoreId(e.target.value)}
          >
            <option value="">{p.t('rst.admin.selectStore')}</option>
            {p.workspace.restaurantStores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      {p.halls.length > 0 ? (
        <FloorHallTabs halls={p.halls} selectedHallId={p.selectedHall?.id} onSelect={p.setSelectedHallId} />
      ) : (
        <div className="rst-empty">{p.t('rst.floor.selectHall')}</div>
      )}

      <div className="rst-halls__plan">
        <FloorCanvas
          variant="admin"
          hall={p.selectedHall}
          onTableClick={(table) => {
            const source = p.selectedHall?.tables?.find((row) => row.id === table.id) ?? table;
            p.setTableModal({
              mode: 'edit',
              form: {
                id: source.id,
                code: source.code,
                label: source.label ?? '',
                seatCount: source.seatCount,
                status: source.status,
                posX: source.posX,
                posY: source.posY,
                width: source.width,
                height: source.height,
              },
            });
          }}
          t={p.t}
        />
      </div>
      <FloorStatusLegend t={p.t} />

      {tables.length ? (
        <div className="rst-halls__table-panel">
          <div className="rst-halls__table-panel-head">
            <strong>{p.t('rst.admin.tablesList')}</strong>
            <span>
              {visibleTables.length}
              {hasMoreTables ? ` / ${tables.length}` : ` · ${tables.length}`}
            </span>
          </div>
          <div ref={tableListRef} className="rst-halls__table-list">
            {visibleTables.map((table) => (
              <div key={table.id} className="rst-halls__row">
                <div>
                  <strong>{table.code}</strong>
                  <div className="rst-halls__row-meta">
                    {p.t(`rst.status.${table.status}`)} · {table.seatCount}
                  </div>
                </div>
                <BaseButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm(p.t('rst.admin.confirmDeactivateTable'))) {
                      p.deactivateTableMutation.mutate(table.id);
                    }
                  }}
                >
                  {p.t('common.delete')}
                </BaseButton>
              </div>
            ))}
            {hasMoreTables ? (
              <div ref={tableSentinelRef} className="rst-halls__scroll-sentinel" aria-hidden>
                {p.t('rst.admin.loadingMore')}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {p.selectedHall ? (
        <div className="mt-3">
          <BaseButton
            type="button"
            variant="ghost"
            onClick={() => {
              if (window.confirm(p.t('rst.admin.confirmDeactivateHall'))) {
                p.deactivateHallMutation.mutate(p.selectedHall.id);
              }
            }}
          >
            {p.t('rst.admin.deactivateHall')}
          </BaseButton>
        </div>
      ) : null}

      <HallFormModal
        open={!!p.hallModal}
        mode={p.hallModal?.mode}
        form={p.hallModal?.form ?? p.emptyHallForm()}
        onChange={(form) => p.setHallModal((prev) => ({ ...prev, form }))}
        onClose={() => p.setHallModal(null)}
        onSubmit={() => p.saveHallMutation.mutate(p.hallModal.form)}
        isPending={p.saveHallMutation.isPending}
        t={p.t}
      />
      <TableFormModal
        open={!!p.tableModal}
        mode={p.tableModal?.mode}
        form={p.tableModal?.form ?? p.nextTableForm()}
        onChange={(form) => p.setTableModal((prev) => ({ ...prev, form }))}
        onClose={() => p.setTableModal(null)}
        onSubmit={() => p.saveTableMutation.mutate(p.tableModal.form)}
        isPending={p.saveTableMutation.isPending}
        t={p.t}
      />
    </section>
  );
}
