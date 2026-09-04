import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseButton, BaseSelect } from '../../../components/ui';
import CategoriesTable from '../components/categories/CategoriesTable';
import CategoryModal from '../components/categories/CategoryModal';
import CategoryDeleteModal from '../components/categories/CategoryDeleteModal';
import CategoryRowMenu from '../components/categories/CategoryRowMenu';
import { useCategoriesPage } from '../hooks/useCategoriesPage';

export default function CategoriesPage({ hideTitle = false } = {}) {
  const { t } = useTranslation();
  const c = useCategoriesPage();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {hideTitle ? <div /> : (
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('categories.title')}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('categories.subtitle', { count: c.categories.length })}
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3">
          {c.companyBusinessTypes.length > 1 ? (
            <div className="min-w-[220px]">
              <BaseSelect
                label={t('categories.filterBusinessType')}
                value={c.businessTypeFilter}
                onChange={(e) => c.handleBusinessTypeFilterChange(e.target.value)}
                options={[
                  { value: '', label: t('categories.filterBusinessTypeAll') },
                  ...c.companyBusinessTypes.map((bt) => ({
                    value: String(bt.id),
                    label: bt.name,
                  })),
                ]}
              />
            </div>
          ) : null}
          {c.manage ? (
            <BaseButton onClick={c.openCreate}>
              <Plus size={16} />
              {t('categories.add')}
            </BaseButton>
          ) : null}
        </div>
      </div>

      <div className="rst-products-table-shell overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <CategoriesTable
          manage={c.manage}
          isLoading={c.isLoading}
          pageRows={c.pageRows}
          categories={c.categories}
          page={c.page}
          pageSize={c.pageSize}
          total={c.total}
          totalPages={c.totalPages}
          onPageChange={c.setPage}
          onPageSizeChange={c.setPageSize}
          onToggleRowMenu={c.toggleRowMenu}
        />
      </div>

      {c.modalOpen && (
        <CategoryModal
          key={c.modalCategory?.id ?? 'new'}
          category={c.modalCategory}
          businessTypes={c.companyBusinessTypes}
          onClose={c.closeModal}
          onSaved={c.onModalSaved}
        />
      )}

      {c.deleteCategory && (
        <CategoryDeleteModal
          category={c.deleteCategory}
          onClose={() => c.setDeleteCategory(null)}
        />
      )}

      <CategoryRowMenu
        rowMenu={c.rowMenu}
        onClose={() => c.setRowMenu(null)}
        onEdit={c.openEdit}
        onDelete={c.openDelete}
      />
    </div>
  );
}
