import React from 'react';
import { ArrowLeft } from 'lucide-react';
import RegionDistrictFields from '../../../shared/geo/RegionDistrictFields';
import { useLeadConvertToCompanyForm } from '../../hooks/useLeadConvertToCompanyForm';
import PlatformLeadConvertSidebar from './PlatformLeadConvertSidebar';
import PlatformLeadBusinessTypeChips, { BUSINESS_TYPE_OPTIONS } from './PlatformLeadBusinessTypeChips';
import PlatformLeadAdminSection from './PlatformLeadAdminSection';

export default function PlatformLeadConvertToCompanyView({
  lead,
  onBack,
  onSubmit,
  isSubmitting,
  t,
}) {
  const form = useLeadConvertToCompanyForm({ lead, onSubmit, isSubmitting });

  if (!lead) return null;

  const guessedLabel = form.guessedCode
    ? (BUSINESS_TYPE_OPTIONS.find((b) => b.code === form.guessedCode)?.label || form.guessedCode)
    : null;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{t ? t('platform.leads.nav', { defaultValue: 'Arizalar' }) : 'Arizalar'}</span>
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Arizadan kompaniya yaratish</h2>
        <p className="text-xs text-slate-500">
          Ariza ma'lumotlari formaga o'zi tushdi. Kompaniya nomini kiriting va faoliyat turini tasdiqlang.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <PlatformLeadConvertSidebar lead={lead} />

        <form onSubmit={form.handleSubmit} className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Kompaniya</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Kompaniya nomi *
                </label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(e) => form.setCompanyName(e.target.value)}
                  placeholder="Masalan: Nodira Market"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Telefon</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => form.setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Yuridik nomi</label>
                <input
                  type="text"
                  value={form.legalName}
                  onChange={(e) => form.setLegalName(e.target.value)}
                  placeholder="Ixtiyoriy"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">STIR</label>
                <input
                  type="text"
                  maxLength={9}
                  value={form.tin}
                  onChange={(e) => form.handleTinChange(e.target.value)}
                  placeholder="Ixtiyoriy, 9 raqam"
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-mono dark:bg-slate-800 dark:text-white ${
                    !form.isTinValid ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500 dark:border-slate-700'
                  }`}
                />
                {!form.isTinValid && (
                  <span className="text-[10px] text-rose-500 mt-0.5 block">STIR 9 ta raqam bo'lishi kerak</span>
                )}
              </div>
            </div>

            <RegionDistrictFields
              regionCode={form.regionCode}
              districtCode={form.districtCode}
              required={true}
              className="mb-0"
              onChange={form.handleGeoChange}
            />

            <PlatformLeadBusinessTypeChips
              selectedType={form.selectedType}
              onSelectType={form.setSelectedType}
              guessedLabel={guessedLabel}
            />
          </div>

          <PlatformLeadAdminSection
            leadName={lead.name}
            branchName={form.branchName}
            onBranchNameChange={form.setBranchName}
            createAdmin={form.createAdmin}
            onCreateAdminChange={form.setCreateAdmin}
            adminName={form.adminName}
            onAdminNameChange={form.setAdminName}
            adminLogin={form.adminLogin}
            onAdminLoginChange={form.setAdminLogin}
            adminEmail={form.adminEmail}
            onAdminEmailChange={form.setAdminEmail}
            adminPassword={form.adminPassword}
            onAdminPasswordChange={form.setAdminPassword}
            onRegeneratePassword={form.handleRegeneratePassword}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <span className={`text-xs ${
              isSubmitting
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold animate-pulse'
                : form.canSubmit
                  ? 'text-slate-500'
                  : 'text-amber-600 dark:text-amber-400 font-medium'
            }`}>
              {form.validationHint}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={!form.canSubmit}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-opacity disabled:opacity-40 hover:bg-slate-800 dark:bg-white dark:text-slate-900 cursor-pointer"
              >
                {isSubmitting ? 'Yaratilmoqda…' : 'Kompaniya yaratish'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
