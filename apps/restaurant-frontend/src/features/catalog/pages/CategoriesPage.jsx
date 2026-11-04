import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseButton } from '../../../components/ui';
import CategoriesTable from '../components/categories/CategoriesTable';
import CategoryModal from '../components/categories/CategoryModal';
import CategoryDeleteModal from '../components/categories/CategoryDeleteModal';
import CategoryRowMenu from '../components/categories/CategoryRowMenu';
import { useCategoriesPage } from '../hooks/useCategoriesPage';
import '../styles/categories-page.css';

export default function CategoriesPage({ hideTitle = false } = {}) {
  const { t } = useTranslation();
  const c = useCategoriesPage();

  return (
    <div className="rst-categories">
      <div className={`rst-categories__toolbar${hideTitle ? ' is-compact' : ''}`}>
        {hideTitle ? null : (
          <div>
            <h1 className="rst-coming__title">{t('categories.title')}</h1>
            <p className="rst-coming__text mb-0">
              {t('categories.subtitle', { count: c.categories.length })}
            </p>
          </div>
        )}
        <div className="rst-categories__actions">
          {c.companyBusinessTypes.length > 1 ? (
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{t('categories.filterBusinessType')}</span>
              <select
                className="form-select"
                value={c.businessTypeFilter}
                onChange={(e) => c.handleBusinessTypeFilterChange(e.target.value)}
              >
                <option value="">{t('categories.filterBusinessTypeAll')}</option>
                {c.companyBusinessTypes.map((bt) => (
                  <option key={bt.id} value={bt.id}>{bt.name}</option>
                ))}
              </select>
            </label>
          ) : null}
          {c.manage ? (
            <BaseButton type="button" onClick={c.openCreate}>
              <Plus size={16} aria-hidden />
              {t('categories.add')}
            </BaseButton>
          ) : null}
        </div>
      </div>

      {c.isError ? (
        <div className="rst-notice">{t('categories.loadFailed', { defaultValue: t('common.error') })}</div>
      ) : null}

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

      <CategoryModal
        open={c.modalOpen}
        category={c.modalCategory}
        businessTypes={c.companyBusinessTypes}
        onClose={c.closeModal}
        onSaved={c.onModalSaved}
      />

      {c.deleteCategory ? (
        <CategoryDeleteModal
          category={c.deleteCategory}
          onClose={() => c.setDeleteCategory(null)}
        />
      ) : null}

      <CategoryRowMenu
        rowMenu={c.rowMenu}
        onClose={() => c.setRowMenu(null)}
        onEdit={c.openEdit}
        onDelete={c.openDelete}
      />
    </div>
  );
}
