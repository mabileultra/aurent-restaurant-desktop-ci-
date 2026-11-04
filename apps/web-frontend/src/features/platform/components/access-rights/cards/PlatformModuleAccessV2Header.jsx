import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Super Admin Kirish huquqlari sahifasi sarlavhasi, yuklanish va xatolik bloki (SRP)
 */
export default function PlatformModuleAccessV2Header({
  currentLang = 'uz',
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              to="/platform/access"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft size={13} />
              <span>{currentLang === 'ru' ? 'Классическая таблица' : 'Klassik jadval'}</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="rounded-md bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 font-semibold dark:bg-emerald-950 dark:text-emerald-300">
              {currentLang === 'ru' ? 'V2 Карточный вид' : 'V2 Kartali ko‘rinish'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {currentLang === 'ru' ? 'Права доступа' : 'Kirish huquqlari'}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {currentLang === 'ru'
              ? 'Просмотр прав доступа к модулям по видам деятельности и ролям сотрудников, управление индивидуальными исключениями.'
              : 'Faoliyat turlari va xodimlar rollari bo‘yicha tizim modullariga kirish huquqlarini ko‘rish va individual istisnolarni boshqarish.'}
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <Loader2 size={14} className="animate-spin text-emerald-600" />
            <span>{currentLang === 'ru' ? 'Данные обновляются...' : 'Ma‘lumotlar yangilanmoqda...'}</span>
          </div>
        )}
      </div>

      {isError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>
              {currentLang === 'ru'
                ? 'Произошла ошибка при загрузке данных: '
                : 'Ma‘lumotlarni yuklashda xatolik yuz berdi: '}
              <strong>{error?.message || (currentLang === 'ru' ? 'Сервер недоступен' : 'Server javob bermadi')}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-xl bg-rose-600 hover:bg-rose-700 px-3 py-1.5 font-bold text-white transition-colors cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>{currentLang === 'ru' ? 'Повторить' : 'Qayta urinish'}</span>
          </button>
        </div>
      )}
    </>
  );
}
