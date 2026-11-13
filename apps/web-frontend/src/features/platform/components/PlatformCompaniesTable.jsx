import React from 'react';
import { RefreshCw, SearchX } from 'lucide-react';
import Alert from '../../../components/aa/Alert';
import Button from '../../../components/aa/Button';
import EmptyState from '../../../components/aa/EmptyState';
import Skeleton from '../../../components/aa/Skeleton';
import PlatformCompaniesTableHeader from './PlatformCompaniesTableHeader';
import PlatformCompaniesTableRow from './PlatformCompaniesTableRow';
import PlatformCompanyPager from './PlatformCompanyPager';
import { useGeoNameLookup } from '../../shared/geo/useGeoNameLookup';

/**
 * PlatformCompaniesTable — Kompaniyalar bo‘limining aa jadvali.
 * Yuklanish, xato, bo‘sh holat va sahifalash boshqariladi.
 */
export default function PlatformCompaniesTable({
  isPending = false,
  isError = false,
  onRetry,
  rows = [],
  page = 0,
  displayPage,
  pageSize = 14,
  total = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  menuId,
  onMenuOpenChange,
  onEdit,
  onDelete,
  onToggleActive,
  onSelectCompany,
  statusFilter = 'ALL',
  hasOtherFilters = false,
  onResetFilters,
}) {
  const effectivePage = typeof displayPage === 'number' ? displayPage : page;
  const regionCodes = rows.map((r) => r.regionCode).filter(Boolean);
  const { regionName, districtName } = useGeoNameLookup(regionCodes);

  // Xato holati
  if (isError && !isPending) {
    return (
      <div className="p-5">
        <Alert
          tone="danger"
          title="Kompaniyalar ro‘yxatini yuklab bo‘lmadi"
          action={
            onRetry ? (
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={16} aria-hidden="true" />}
                onClick={onRetry}
              >
                Qayta urinish
              </Button>
            ) : null
          }
        >
          Internet aloqasini tekshirib, qayta urinib ko‘ring.
        </Alert>
      </div>
    );
  }

  // Bo‘sh holat (yuklanish bo‘lmaganda va qatorlar 0 bo‘lganda)
  if (!isPending && rows.length === 0) {
    const isOnlyInactiveFilter = statusFilter === 'INACTIVE' && !hasOtherFilters;

    if (isOnlyInactiveFilter) {
      return (
        <EmptyState
          icon={<SearchX size={20} className="text-aa-ink-muted" aria-hidden="true" />}
          title="Nofaol kompaniya yo‘q"
          text="Hamma kompaniyalar faol. Faolsizlantirilgan kompaniyalar shu yerda ko‘rinadi."
        />
      );
    }

    return (
      <EmptyState
        icon={<SearchX size={20} className="text-aa-ink-muted" aria-hidden="true" />}
        title="Kompaniya topilmadi"
        text="Qidiruv va filtrlarga mos kompaniya yo‘q. So‘zni o‘zgartiring yoki filtrlarni tozalang."
        actions={
          onResetFilters ? (
            <Button variant="secondary" onClick={onResetFilters}>
              Filtrlarni tozalash
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="aa-table-scroll relative w-full max-w-full overflow-x-auto">
        <table className="aa-table" aria-busy={isPending ? 'true' : undefined}>
          <PlatformCompaniesTableHeader />
          <tbody>
            {isPending ? (
              Array.from({ length: 8 }).map((_, rIdx) => (
                <tr key={`skel-${rIdx}`} className="h-[52px]">
                  <td className="w-12 text-center">
                    <Skeleton variant="text" width="20px" className="mx-auto" />
                  </td>
                  <td className="w-16">
                    <Skeleton variant="text" width="32px" />
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <Skeleton variant="avatar" className="w-8 h-8 rounded-aa-full shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton variant="text" width="140px" />
                        <Skeleton variant="text" width="90px" />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1.5">
                      <Skeleton variant="text" width="100px" />
                      <Skeleton variant="text" width="70px" />
                    </div>
                  </td>
                  <td>
                    <Skeleton variant="text" width="60px" />
                  </td>
                  <td className="text-right">
                    <Skeleton variant="text" width="30px" className="ml-auto" />
                  </td>
                  <td>
                    <Skeleton variant="badge" width="80px" />
                  </td>
                  <td>
                    <Skeleton variant="badge" width="60px" />
                  </td>
                  <td className="w-12 text-right">
                    <Skeleton variant="text" width="24px" className="ml-auto" />
                  </td>
                </tr>
              ))
            ) : (
              rows.map((row, index) => (
                <PlatformCompaniesTableRow
                  key={row.id}
                  row={row}
                  index={index}
                  effectivePage={effectivePage}
                  pageSize={pageSize}
                  districtName={districtName}
                  regionName={regionName}
                  menuId={menuId}
                  onMenuOpenChange={onMenuOpenChange}
                  onSelectCompany={onSelectCompany}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleActive={onToggleActive}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pager: yuklanishda yashiriladi */}
      {!isPending && rows.length > 0 && (
        <PlatformCompanyPager
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
