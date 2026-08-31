import { PageLayout, PageSearchField } from '../../../components/ui';
import PlatformLeadDetailModal from '../components/leads/PlatformLeadDetailModal';
import PlatformLeadsTable from '../components/leads/PlatformLeadsTable';
import { usePlatformLeadsPage } from '../hooks/usePlatformLeadsPage';

export default function PlatformLeadsPage() {
  const p = usePlatformLeadsPage();

  return (
    <PageLayout
      spacing="space-y-4"
      title={p.t('platform.leads.title')}
      subtitle={p.t('platform.leads.subtitle')}
      filters={(
        <div className="space-y-3">
          <PageSearchField
            value={p.search}
            onChange={p.handleSearchChange}
            placeholder={p.t('platform.leads.search')}
          />
          <div className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 p-0.5 text-xs dark:border-slate-700">
            {p.statusOptions.map((value) => (
              <button
                key={value || 'all'}
                type="button"
                onClick={() => p.handleStatusFilter(value)}
                className={`rounded px-3 py-1 font-medium transition-colors ${
                  p.status === value
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {value ? p.t(`platform.leads.statuses.${value}`) : p.t('platform.leads.filterAll')}
              </button>
            ))}
          </div>
        </div>
      )}
    >
      <PlatformLeadsTable
        t={p.t}
        isPending={p.isPending}
        rows={p.rows}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
        onOpen={p.openDetail}
      />

      <PlatformLeadDetailModal
        open={p.detailOpen}
        lead={p.selectedLead}
        t={p.t}
        editStatus={p.editStatus}
        onStatusChange={p.setEditStatus}
        editNote={p.editNote}
        onNoteChange={p.setEditNote}
        onClose={p.closeDetail}
        onSave={p.saveDetail}
        isSaving={p.isSaving}
      />
    </PageLayout>
  );
}
