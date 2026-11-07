import React from 'react';
import { Monitor, Smartphone, Radio, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseButton } from '../../../../components/ui';
import { resolveAttemptBadge } from '../../utils/securityFormatUtils';

const ATTEMPT_FILTER_KEYS = [
  { id: 'all', key: 'platform.security.filterAll', label: 'Barchasi' },
  { id: 'ok', key: 'platform.security.filterOk', label: 'Muvaffaqiyatli' },
  { id: 'fail', key: 'platform.security.filterFail', label: 'Muvaffaqiyatsiz' },
  { id: 'blocked', key: 'platform.security.filterBlocked', label: 'Bloklangan' },
];

export default function PlatformSecuritySessionsTab({ flow }) {
  const { t } = useTranslation();
  const { sessions, attempts, filter, setFilter, requestCloseAllOthers } = flow;
  const hasAttempts = attempts.length > 0;

  return (
    <div className="space-y-6">
      {/* 1. Faol seanslar bloki */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{t('platform.security.activeSessionsTitle', 'Faol seanslar')}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {sessions.length} {t('platform.security.qtySuffix', 'ta')}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('platform.security.activeSessionsSubtitle', 'Hozirda tizimga ulangan qurilmalar va brauzerlar')}
            </p>
          </div>
          {sessions.length > 1 && (
            <div className="flex items-center gap-2">
              <BaseButton
                variant="secondary"
                className="text-xs font-semibold text-rose-600"
                onClick={requestCloseAllOthers}
                disabled={flow.isRevoking}
              >
                {t('platform.security.closeAllOtherSessions', 'Boshqa barcha seanslarni yopish')}
              </BaseButton>
            </div>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <Radio className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {t('platform.security.emptySessions', 'Faol seanslar ma’lumotlari mavjud emas')}
            </span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {t('platform.security.sessionsNotice', 'Seanslar monitoringi API ishga tushganda bu yerda ko‘rinadi')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {sessions.map((sess) => {
              const isPhone = sess.deviceType === 'phone';
              return (
                <div key={sess.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        {isPhone ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{sess.device}</span>
                          {sess.current && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {t('platform.security.currentSession', 'Hozirgi seans')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">{sess.who}</p>
                        <p className="text-xs text-slate-500 mt-1">{sess.where}</p>
                      </div>
                    </div>
                    {!sess.current && (
                      <BaseButton
                        variant="secondary"
                        className="text-[11px] text-rose-600"
                        onClick={() => flow.requestCloseSession(sess)}
                        disabled={flow.isRevoking}
                      >
                        {t('platform.security.closeSession', 'Yopish')}
                      </BaseButton>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">{sess.when}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Kirishlar jurnali */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t('platform.security.loginLogTitle', 'Kirishlar jurnali')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {hasAttempts ? `${attempts.length} ${t('platform.security.recordsShown', 'ta yozuv ko‘rsatilmoqda')}` : t('platform.security.loginLogSubtitle', 'Kirish urinishlari ro‘yxati')}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {ATTEMPT_FILTER_KEYS.map((f) => (
              <button
                key={f.id}
                type="button"
                disabled={!hasAttempts}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  !hasAttempts
                    ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed opacity-50'
                    : filter === f.id
                    ? 'bg-emerald-900 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {t(f.key, f.label)}
              </button>
            ))}
          </div>
        </div>

        {!hasAttempts ? (
          <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {t('platform.security.emptyAttempts', 'Kirishlar tarixi mavjud emas')}
            </span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {t('platform.security.attemptsNotice', 'Kirish hodisalari API ulanganda ushbu jadvalda paydo bo‘ladi')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">{t('platform.security.colTime', 'Vaqt')}</th>
                  <th className="py-2.5 px-3">{t('platform.security.colStaffLogin', 'Xodim / Login')}</th>
                  <th className="py-2.5 px-3">{t('platform.security.colResult', 'Natija')}</th>
                  <th className="py-2.5 px-3">{t('platform.security.colIpLocation', 'IP va Joylashuv')}</th>
                  <th className="py-2.5 px-3">{t('platform.security.colDeviceNote', 'Qurilma / Izoh')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attempts.map((row) => {
                  const b = resolveAttemptBadge(row.status);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">{row.time}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{row.who}</div>
                        <div className="text-[11px] text-slate-400">{row.login}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold" style={{ backgroundColor: b.bg, color: b.color }}>
                          {b.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-slate-700 dark:text-slate-300">{row.ip}</div>
                        <div className="text-[11px] text-slate-400">{row.geo}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800 dark:text-slate-200">{row.device}</div>
                        <div className="text-[11px] text-slate-400">{row.note}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
