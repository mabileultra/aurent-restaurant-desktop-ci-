import React from 'react';

export default function AccessRightsCopyStrategySelector({ copyMode, onChangeMode, isRu }) {
  const strategies = [
    {
      id: 'merge',
      title: isRu ? 'Добавить (MERGE)' : 'Istisnolarni qo‘shish',
      desc: isRu
        ? 'Сохраняет текущие исключения сотрудника, добавляя новые.'
        : 'Xodimning o‘z istisnolari qoladi, manbadagilar qo‘shiladi.',
    },
    {
      id: 'replace',
      title: isRu ? 'Заменить (REPLACE)' : 'To‘liq almashtirish',
      desc: isRu
        ? 'Полностью заменяет права сотрудника правами источника.'
        : 'Xodimning istisnolari o‘chirilib, manba bilan bir xil bo‘ladi.',
    },
  ];

  return (
    <div className="space-y-2">
      <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
        {isRu ? '3. СТРАТЕГИЯ' : '3. QANDAY KO‘CHIRILSIN'}
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {strategies.map((st) => (
          <label
            key={st.id}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              copyMode === st.id
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              <input
                type="radio"
                name="copyMode"
                checked={copyMode === st.id}
                onChange={() => onChangeMode(st.id)}
              />
              <span>{st.title}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 pl-5">{st.desc}</p>
          </label>
        ))}
      </div>
    </div>
  );
}
