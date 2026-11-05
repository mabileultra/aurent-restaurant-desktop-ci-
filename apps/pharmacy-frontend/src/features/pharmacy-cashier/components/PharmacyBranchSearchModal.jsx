import { useEffect, useState } from 'react';
import { pharmacyWarehouseApi, storeApi } from '../../../api';
import PosModalPortal from '../../../components/shared/PosModalPortal';

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

/** Поиск товара в выбранном филиале. */
export default function PharmacyBranchSearchModal({ open, onClose }) {
  const [stores, setStores] = useState([]);
  const [storesError, setStoresError] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setStoresError(false);
    storeApi.getAll({ size: 200 })
      .catch(() => storeApi.getManaged({ size: 200 }))
      .then((res) => {
        if (cancelled) return;
        const list = asList(res?.data);
        setStores(list);
        setStoreId((prev) => prev || (list[0]?.id != null ? String(list[0].id) : ''));
        if (!list.length) setStoresError(true);
      })
      .catch(() => {
        if (!cancelled) {
          setStores([]);
          setStoresError(true);
        }
      });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const text = query.trim();
    if (!storeId || text.length < 2) {
      setRows([]);
      setSearched(false);
      setSearchError(false);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setSearchError(false);
      pharmacyWarehouseApi.listProducts({
        storeId: Number(storeId),
        search: text,
        page: 0,
        size: 20,
        activeOnly: true,
        scope: 'ACTIVE',
      })
        .then(({ data }) => {
          if (cancelled) return;
          setRows(asList(data));
          setSearched(true);
        })
        .catch(() => {
          if (cancelled) return;
          setRows([]);
          setSearched(true);
          setSearchError(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, storeId, query]);

  const hint = storesError
    ? 'Не удалось загрузить филиалы'
    : searchError
      ? 'Поиск не выполнился. Попробуйте ещё раз'
      : query.trim().length < 2
        ? 'Введите название, штрихкод или ИКПУ'
        : loading
          ? 'Ищем…'
          : searched && rows.length === 0
            ? 'Ничего не найдено'
            : '';

  return (
    <PosModalPortal open={open} onClose={onClose}>
      <div className="pharmacy-modal pharmacy-modal__panel pharmacy-branch-search" role="dialog" aria-modal="true" aria-label="Поиск по филиалам">
        <header className="pharmacy-modal__head">
          <h2 className="pharmacy-modal__title">Поиск по филиалам</h2>
          <button type="button" className="pharmacy-modal__close" onClick={onClose} aria-label="Закрыть">×</button>
        </header>
        <div className="pharmacy-branch-search__filters">
          <label>
            <span>Филиал</span>
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)} aria-label="Филиал">
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Товар</span>
            <input
              value={query}
              placeholder="Название, штрихкод или ИКПУ"
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <ul className="pharmacy-branch-search__list">
          {rows.map((row) => (
            <li key={row.id}>
              <span className="pharmacy-branch-search__name">{row.name}</span>
              <span className="pharmacy-branch-search__qty">{row.stockQuantity ?? '—'}</span>
              <span className="pharmacy-branch-search__price">{money(row.sellingPrice)}</span>
            </li>
          ))}
          {rows.length === 0 && hint ? <li className="is-empty">{hint}</li> : null}
        </ul>
      </div>
    </PosModalPortal>
  );
}
