import { PageLayout } from '../../../components/ui';
import PlatformCompactFilterBar from '../components/PlatformCompactFilterBar';
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
        <PlatformCompactFilterBar
          search={p.search}
          onSearchChange={p.handleSearchChange}
          searchPlaceholder={p.t('platform.leads.search')}
          filterOptions={p.statusOptions.map((value) => ({
            value,
            label: value ? p.t(`platform.leads.statuses.${value}`) : p.t('platform.leads.filterAll'),
          }))}
          filterValue={p.status}
          onFilterChange={p.handleStatusFilter}
        />
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
        onDelete={p.deleteDetail}
        isSaving={p.isSaving}
        isDeleting={p.isDeleting}
      />
    </PageLayout>
  );
}
