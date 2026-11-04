import React from 'react';
import { MapPin } from 'lucide-react';

export default function StoresGroupedLocationCell({ store, regionName, districtName, empty }) {
  const reg = store.regionCode ? regionName(store.regionCode) : '';
  const dist = store.districtCode ? districtName(store.districtCode) : '';
  const isClean = (v) => v && v !== empty && v !== 'Yo‘q' && v !== "Yo'q" && v !== 'Нет';
  const geoLine = [isClean(reg) ? reg : '', isClean(dist) ? dist : ''].filter(Boolean).join(', ');
  const addrLine = store.address?.trim() || '';

  if (!addrLine && !geoLine) {
    return <span className="text-slate-400 dark:text-slate-600 font-medium">—</span>;
  }

  return (
    <div className="flex flex-col text-xs max-w-xs sm:max-w-sm truncate">
      {addrLine && (
        <span className="font-medium text-slate-800 dark:text-slate-200 truncate" title={addrLine}>
          {addrLine}
        </span>
      )}
      {geoLine && (
        <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate flex items-center gap-1 mt-0.5" title={geoLine}>
          <MapPin size={11} className="shrink-0 text-slate-400" />
          <span>{geoLine}</span>
        </span>
      )}
    </div>
  );
}
