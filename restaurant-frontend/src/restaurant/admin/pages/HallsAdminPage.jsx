import { BaseButton } from '../../../components/ui';
import FloorHallTabs from '../../pos/components/FloorHallTabs';
import HallFormModal from '../components/HallFormModal';
import TableFormModal from '../components/TableFormModal';
import HallsPlanPanel from '../components/HallsPlanPanel';
import HallsTablesPanel from '../components/HallsTablesPanel';
import { useHallsAdminPage } from '../hooks/useHallsAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';

function openTableEdit(p, table) {
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
}

export default function HallsAdminPage() {
  const p = useHallsAdminPage();
  const tables = p.selectedHall?.tables ?? [];

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-halls">
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
            </>
          ) : null}
        </div>
      </div>

      {p.halls.length > 0 ? (
        <FloorHallTabs halls={p.halls} selectedHallId={p.selectedHall?.id} onSelect={p.setSelectedHallId} />
      ) : (
        <div className="rst-empty">{p.t('rst.floor.selectHall')}</div>
      )}

      {p.selectedHall ? (
        <div className="rst-halls__workspace">
          <HallsPlanPanel
            hall={p.selectedHall}
            onTableClick={(table) => openTableEdit(p, table)}
            t={p.t}
          />
          <HallsTablesPanel
            tables={tables}
            hallId={p.selectedHall.id}
            onAddTable={() => p.setTableModal({ mode: 'create', form: p.nextTableForm(tables) })}
            onEditTable={(table) => openTableEdit(p, table)}
            onDeactivateTable={(id) => p.deactivateTableMutation.mutate(id)}
            t={p.t}
          />
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
