import React from 'react';
import { BaseCheckbox } from '../../../components/ui';

export default function CashRegisterConfigStorePicker({
  t,
  stores = [],
  storeIds,
  toggleStore,
  visibleRegisters = [],
  registerIds,
  toggleRegister,
}) {
  return (
    <>
      <div>
        <div className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('cashRegisters.configStoresLabel')}
        </div>
        <div className="crc-modal__pick-list">
          {stores.length === 0 ? (
            <p className="crc-modal__empty">{t('cashRegisters.configEmptyStores')}</p>
          ) : (
            stores.map((s) => (
              <label key={s.id} className="crc-modal__pick-row flex items-center gap-2 cursor-pointer">
                <BaseCheckbox checked={storeIds.has(s.id)} onChange={() => toggleStore(s.id)} size={18} />
                <span>{s.name}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('cashRegisters.configRegistersLabel')}
        </div>
        <div className="crc-modal__pick-list">
          {visibleRegisters.length === 0 ? (
            <p className="crc-modal__empty">
              {storeIds.size > 0
                ? t('cashRegisters.configEmptyRegisters')
                : t('cashRegisters.configEmptyRegisters')}
            </p>
          ) : (
            visibleRegisters.map((r) => (
              <label key={r.id} className="crc-modal__pick-row flex items-center gap-2 cursor-pointer">
                <BaseCheckbox checked={registerIds.has(r.id)} onChange={() => toggleRegister(r.id)} size={18} />
                <span className="break-all">
                  {r.storeName} · №{r.registerNumber}
                  {r.equipmentSerial ? ` · ${r.equipmentSerial}` : ''}
                </span>
              </label>
            ))
          )}
        </div>
      </div>
    </>
  );
}
