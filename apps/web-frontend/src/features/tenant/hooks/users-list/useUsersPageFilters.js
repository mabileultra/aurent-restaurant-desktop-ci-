import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const DEFAULT_PAGE_SIZE = 20;

/**
 * useUsersPageFilters
 * Manages URL search params and filter setters for UsersPage.
 */
export function useUsersPageFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const roleFilter = searchParams.get('role') ?? 'ALL';
  const statusFilter = searchParams.get('status') ?? 'ALL';
  const businessType = searchParams.get('businessType') ?? '';
  const companyId = searchParams.get('companyId') ?? '';
  const regionCode = searchParams.get('regionCode') ?? '';
  const districtCode = searchParams.get('districtCode') ?? '';
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10) || 0);
  const pageSize = Math.max(1, parseInt(searchParams.get('size') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE);
  const sortField = searchParams.get('sort') ?? 'fullName';
  const sortDirection = searchParams.get('dir') ?? 'asc';

  const updateParams = useCallback((mutator) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      mutator(next);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setPage = useCallback((nextPage) => {
    updateParams((p) => {
      const target = typeof nextPage === 'function' ? nextPage(page) : nextPage;
      if (target <= 0) p.delete('page');
      else p.set('page', String(target));
    });
  }, [page, updateParams]);

  const handlePageSizeChange = useCallback((nextSize) => {
    updateParams((p) => {
      p.set('size', String(nextSize));
      p.delete('page');
    });
  }, [updateParams]);

  const handleSearchChange = useCallback((value) => {
    updateParams((p) => {
      if (value) p.set('q', value);
      else p.delete('q');
      p.delete('page');
    });
  }, [updateParams]);

  const handleRoleFilterChange = useCallback((role) => {
    updateParams((p) => {
      if (role && role !== 'ALL') p.set('role', role);
      else p.delete('role');
      p.delete('page');
    });
  }, [updateParams]);

  const handleStatusFilterChange = useCallback((status) => {
    updateParams((p) => {
      if (status && status !== 'ALL') p.set('status', status);
      else p.delete('status');
      p.delete('page');
    });
  }, [updateParams]);

  const handleBusinessTypeChange = useCallback((code) => {
    updateParams((p) => {
      if (code) p.set('businessType', code);
      else p.delete('businessType');
      p.delete('page');
    });
  }, [updateParams]);

  const handleCompanyChange = useCallback((id) => {
    updateParams((p) => {
      if (id) p.set('companyId', String(id));
      else p.delete('companyId');
      p.delete('page');
    });
  }, [updateParams]);

  const handleGeoChange = useCallback(({ regionCode: r, districtCode: d }) => {
    updateParams((p) => {
      if (r) p.set('regionCode', r);
      else p.delete('regionCode');
      if (d) p.set('districtCode', d);
      else p.delete('districtCode');
      p.delete('page');
    });
  }, [updateParams]);

  const handleSort = useCallback((field) => {
    updateParams((p) => {
      if (sortField === field) {
        p.set('dir', sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        p.set('sort', field);
        p.set('dir', 'asc');
      }
    });
  }, [sortField, sortDirection, updateParams]);

  const handleResetFilters = useCallback(() => {
    updateParams((p) => {
      p.delete('q');
      p.delete('role');
      p.delete('status');
      p.delete('businessType');
      p.delete('companyId');
      p.delete('regionCode');
      p.delete('districtCode');
      p.delete('page');
    });
  }, [updateParams]);

  const hasActiveFilters = Boolean(
    search.trim()
    || (roleFilter && roleFilter !== 'ALL')
    || (statusFilter && statusFilter !== 'ALL')
    || businessType
    || companyId
    || regionCode
    || districtCode
  );

  const hasContextFilters = Boolean(
    search.trim()
    || businessType
    || companyId
    || regionCode
    || districtCode
  );

  return {
    search,
    roleFilter,
    statusFilter,
    businessType,
    companyId,
    regionCode,
    districtCode,
    page,
    pageSize,
    sortField,
    sortDirection,
    setPage,
    handlePageSizeChange,
    handleSearchChange,
    handleRoleFilterChange,
    handleStatusFilterChange,
    handleBusinessTypeChange,
    handleCompanyChange,
    handleGeoChange,
    handleSort,
    handleResetFilters,
    hasActiveFilters,
    hasContextFilters,
  };
}
