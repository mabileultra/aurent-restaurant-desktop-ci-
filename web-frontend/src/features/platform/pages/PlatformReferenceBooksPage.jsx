import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { platformReferenceBookApi } from '../../../api';
import { BaseButton, BaseInput, BaseModal, PageLayout, inputCls } from '../../../components/ui';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import { entriesToText, parseEntriesText } from '../utils/businessTypeUtils';

const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  active: true,
  entriesText: '',
};

export default function PlatformReferenceBooksPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ['platform-reference-books'],
    queryFn: () => platformReferenceBookApi.list().then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['platform-reference-books'] });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      payload.id
        ? platformReferenceBookApi.update(payload.id, payload.body)
        : platformReferenceBookApi.create(payload.body),
    onSuccess: () => {
      invalidate();
      setModal(null);
      toast.success(t('platform.referenceBooks.saved'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => platformReferenceBookApi.delete(id),
    onSuccess: () => {
      invalidate();
      toast.success(t('platform.referenceBooks.deleted'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({ mode: 'create' });
  };

  const openEdit = async (book) => {
    const detail = await platformReferenceBookApi.get(book.id).then((r) => r.data);
    setForm({
      code: detail.code,
      name: detail.name,
      description: detail.description ?? '',
      active: detail.active,
      entriesText: entriesToText(detail.entries),
    });
    setModal({ mode: 'edit', id: book.id });
  };

  const save = () => {
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      active: form.active,
      entries: parseEntriesText(form.entriesText),
    };
    if (modal?.mode === 'create') {
      saveMutation.mutate({ body: { ...body, code: form.code.trim().toLowerCase() } });
      return;
    }
    saveMutation.mutate({ id: modal.id, body });
  };

  const tryDelete = (book) => {
    if (window.confirm(t('platform.referenceBooks.deleteConfirm', { name: book.name }))) {
      deleteMutation.mutate(book.id);
    }
  };

  return (
    <PageLayout
      title={t('platform.referenceBooks.title')}
      subtitle={t('platform.referenceBooks.subtitle')}
      actions={(
        <BaseButton onClick={openCreate} className="admin-btn-primary">
          <Plus size={16} />
          {t('platform.referenceBooks.add')}
        </BaseButton>
      )}
    >
      <div className="admin-table-shell overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <AdminTableNoIdHeaders />
              <th className="px-4 py-3">{t('platform.referenceBooks.colName')}</th>
              <th className="px-4 py-3">{t('platform.referenceBooks.colCode')}</th>
              <th className="px-4 py-3">{t('platform.referenceBooks.colEntries')}</th>
              <th className="px-4 py-3">{t('platform.referenceBooks.colActive')}</th>
              <th className="px-4 py-3 text-right">{t('categories.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  {t('platform.referenceBooks.empty')}
                </td>
              </tr>
            ) : (
              books.map((book, index) => (
                <tr key={book.id}>
                  <AdminTableNoIdCells page={0} pageSize={books.length || 1} index={index} id={book.id} />
                  <td className="px-4 py-3 font-medium">{book.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{book.code}</td>
                  <td className="px-4 py-3">{book.entriesCount}</td>
                  <td className="px-4 py-3">{book.active ? t('common.yes') : t('common.no')}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => openEdit(book)} className="mr-3 text-xs text-emerald-600">
                      {t('common.edit')}
                    </button>
                    <button type="button" onClick={() => tryDelete(book)} className="text-xs text-red-600">
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal ? (
        <BaseModal
          onClose={() => setModal(null)}
          title={modal.mode === 'create' ? t('platform.referenceBooks.add') : t('common.edit')}
          size="lg"
        >
          <div className="space-y-3">
            {modal.mode === 'create' ? (
              <BaseInput
                placeholder={t('platform.referenceBooks.codePh')}
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              />
            ) : (
              <p className="text-sm text-slate-500">
                {t('platform.referenceBooks.colCode')}
                :
                {' '}
                <span className="font-mono">{form.code}</span>
              </p>
            )}
            <BaseInput
              placeholder={t('platform.referenceBooks.namePh')}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <BaseInput
              placeholder={t('platform.referenceBooks.descriptionPh')}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              />
              {t('platform.referenceBooks.active')}
            </label>
            <textarea
              className={inputCls}
              rows={6}
              placeholder={t('platform.referenceBooks.entriesPh')}
              value={form.entriesText}
              onChange={(e) => setForm((prev) => ({ ...prev, entriesText: e.target.value }))}
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <BaseButton variant="secondary" onClick={() => setModal(null)}>
              {t('common.cancel')}
            </BaseButton>
            <BaseButton onClick={save} disabled={saveMutation.isPending}>
              {t('common.save')}
            </BaseButton>
          </div>
        </BaseModal>
      ) : null}
    </PageLayout>
  );
}
