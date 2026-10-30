import { BaseButton } from '../../../components/ui';
import FloorHallTabs from '../../pos/components/FloorHallTabs';
import HallFormModal from '../components/HallFormModal';
import TableFormModal from '../components/TableFormModal';
import HallsPlanPanel from '../components/HallsPlanPanel';
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
      servicePercent: source.servicePercent == null ? '' : source.servicePercent,
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

  if (!p.workspace.storeId) {
    return <div className="rst-notice">{p.t('rst.admin.selectStore')}</div>;
  }

  if (p.isLoading) {
    return <div className="rst-empty">{p.t('common.loading')}</div>;
  }

  if (p.isError) {
    return (
      <div className="rst-notice">
        <p className="mb-2">{p.t('rst.admin.hallsLoadFailed', { defaultValue: 'Не удалось загрузить залы' })}</p>
        <BaseButton type="button" onClick={() => p.refetch()}>
          {p.t('common.retry', { defaultValue: 'Повторить' })}
        </BaseButton>
      </div>
    );
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
                  form: {
                    id: p.selectedHall.id,
                    name: p.selectedHall.name,
                    sortOrder: p.selectedHall.sortOrder,
                    servicePercent: p.selectedHall.servicePercent ?? 0,
                  },
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
        <div className="rst-empty">
          {p.t('rst.admin.hallsEmpty', {
            defaultValue: 'Залов пока нет. Создайте зал — всё хранится локально на этом ПК.',
          })}
        </div>
      )}

      {p.selectedHall ? (
        <div className="rst-halls__workspace">
          <HallsPlanPanel
            hall={p.selectedHall}
            onTableClick={(table) => openTableEdit(p, table)}
            onTableMove={(moved) => p.moveTableMutation.mutate(moved)}
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
        onDeactivate={(id) => {
          p.deactivateTableMutation.mutate(id, {
            onSuccess: () => p.setTableModal(null),
          });
        }}
        onSubmit={() => {
          const form = p.tableModal.form;
          const hallPercent = Number(p.selectedHall?.servicePercent) || 0;
          const own = String(form.servicePercent ?? '').trim();
          const previous = tables.find((table) => table.id === form.id);
          const previousOwn = previous?.servicePercent == null ? '' : String(previous.servicePercent);
          const changed = own !== '' && Number(own) !== Number(previousOwn === '' ? NaN : previousOwn);
          if (hallPercent > 0 && changed) {
            const shown = Number.isInteger(hallPercent) ? String(hallPercent) : String(hallPercent);
            const ok = window.confirm(p.t('rst.admin.tableServiceConfirm', { percent: shown }));
            if (!ok) return;
          }
          p.saveTableMutation.mutate(form);
        }}
        isPending={p.saveTableMutation.isPending || p.deactivateTableMutation.isPending}
        t={p.t}
      />
    </section>
  );
}
