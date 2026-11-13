import { useEffect, useRef, useState } from 'react';
import { pharmacyWarehouseApi } from '../../../api';

/** Название товара с подсказкой из государственного реестра. */
export default function PharmacyProductNameField({ t, form, patch }) {
  const [hits, setHits] = useState([]);
  const picked = useRef('');

  useEffect(() => {
    const q = String(form.name || '').trim();
    if (q.length < 2 || q === picked.current) {
      setHits([]);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      pharmacyWarehouseApi.drugRegistrySearch(q)
        .then((res) => {
          if (!cancelled) setHits(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => {
          if (!cancelled) setHits([]);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.name]);

  function pick(hit) {
    const name = hit.tradeName || form.name;
    picked.current = name;
    patch('name', name);
    if (hit.manufacturer) patch('manufacturer', hit.manufacturer);
    if (hit.country) patch('country', hit.country);
    if (hit.dosageForm) patch('dosageForm', hit.dosageForm);
    if (hit.atcCode) patch('atcCode', hit.atcCode);
    if (hit.registrationNumber) patch('registrationNumber', hit.registrationNumber);
    if (hit.prescriptionRequired != null) patch('prescriptionRequired', Boolean(hit.prescriptionRequired));
    setHits([]);
  }

  return (
    <label className="pharm-product-modal__field pharm-product-modal__field--relative">
      <span className="pharm-product-modal__label">
        {t('pharmacyStock.colName')}
        <span className="pharm-product-modal__req"> *</span>
      </span>
      <input
        className="pharm-product-modal__input"
        value={form.name}
        onChange={(e) => {
          picked.current = '';
          patch('name', e.target.value);
        }}
      />
      {form.registrationNumber ? (
        <span className="pharm-product-modal__check-hint">
          {t('pharmacyStock.drugRegistryFrom')}: {form.registrationNumber}
        </span>
      ) : null}
      {hits.length > 0 ? (
        <ul className="pharm-product-modal__suggest">
          {hits.map((hit) => (
            <li key={hit.id}>
              <button type="button" onClick={() => pick(hit)}>
                <span className="pharm-product-modal__suggest-name">{hit.tradeName}</span>
                <span className="pharm-product-modal__suggest-code">
                  {[hit.country, hit.manufacturer].filter(Boolean).join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}
