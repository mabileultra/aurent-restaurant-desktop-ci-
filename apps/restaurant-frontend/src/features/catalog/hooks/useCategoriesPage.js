import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '../../../api/category.api';
import { useAuthStore } from '../../../store/authStore';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { useCompanyBusinessType } from '../../../hooks/useCompanyBusinessType';
import { canManageCatalog } from '../constants';

export function useCategoriesPage() {
  const user = useAuthStore((s) => s.user);
  const { tenantKey, tenantReady } = useTenantScope();
  const { types: companyBusinessTypes } = useCompanyBusinessType();
  const manage = canManageCatalog(user?.role);

  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [rowMenu, setRowMenu] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);
  const [businessTypeFilter, setBusinessTypeFilter] = useState('');

  const filterParams = useMemo(
    () => (businessTypeFilter ? { businessTypeId: Number(businessTypeFilter) } : undefined),
    [businessTypeFilter],
  );

  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: tenantKey('categories', filterParams),
    queryFn: () => categoryApi.getAll(filterParams).then((r) => r.data),
    enabled: tenantReady,
  });

  useEffect(() => {
    if (!rowMenu) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setRowMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rowMenu]);

  const total = categories.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const pageRows = useMemo(() => {
    const start = page * pageSize;
    return categories.slice(start, start + pageSize);
  }, [categories, page, pageSize]);

  useEffect(() => {
    if (page > 0 && page >= totalPages) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const openCreate = () => {
    setEditCategory(null);
    setCreateOpen(true);
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditCategory(null);
  };

  const onModalSaved = () => {
    setCreateOpen(false);
    setEditCategory(null);
  };

  const openEdit = (category) => {
    setCreateOpen(false);
    setEditCategory(category);
    setRowMenu(null);
  };

  const openDelete = (category) => {
    setDeleteCategory(category);
    setRowMenu(null);
  };

  const toggleRowMenu = (category, rect) => {
    setRowMenu((cur) => (cur?.category?.id === category.id ? null : { category, rect }));
  };

  const handleBusinessTypeFilterChange = (value) => {
    setBusinessTypeFilter(value);
    setPage(0);
  };

  return {
    manage,
    categories,
    companyBusinessTypes,
    businessTypeFilter,
    handleBusinessTypeFilterChange,
    isLoading,
    isError,
    pageRows,
    page,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize,
    deleteCategory,
    setDeleteCategory,
    rowMenu,
    setRowMenu,
    openCreate,
    closeModal,
    onModalSaved,
    openEdit,
    openDelete,
    toggleRowMenu,
    modalOpen: createOpen || Boolean(editCategory),
    modalCategory: editCategory,
  };
}
