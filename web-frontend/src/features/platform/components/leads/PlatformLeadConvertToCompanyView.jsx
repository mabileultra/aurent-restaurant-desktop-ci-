import React, { useState, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { guessBusinessTypeFromMessage } from '../../utils/leadFormatUtils';
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
  const guessedCode = useMemo(() => guessBusinessTypeFromMessage(lead?.message), [lead?.message]);
  const guessedLabel = BUSINESS_TYPE_OPTIONS.find((b) => b.code === guessedCode)?.label || 'Universal';

  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState(lead?.phone || '');
  const [legalName, setLegalName] = useState('');
  const [tin, setTin] = useState('');
  const [selectedType, setSelectedType] = useState(guessedCode);
  const [branchName, setBranchName] = useState('Asosiy filial');
  const [createAdmin, setCreateAdmin] = useState(true);
  const [adminName, setAdminName] = useState(lead?.name || '');
  const [adminLogin, setAdminLogin] = useState(() => {
    const raw = (lead?.email ? lead.email.split('@')[0] : lead?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return raw || 'admin';
  });
  const [markDone, setMarkDone] = useState(true);

  if (!lead) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!companyName.trim() || isSubmitting) return;

    onSubmit({
      leadId: lead.id,
      company: {
        name: companyName.trim(),
        phone: phone.trim(),
        legalName: legalName.trim() || null,
        tin: tin.trim() || null,
        businessType: selectedType,
      },
      branchName: branchName.trim() || 'Asosiy filial',
      adminUser: createAdmin ? { name: adminName.trim(), login: adminLogin.trim() } : null,
      markDone,
    });
  };

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

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
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
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Masalan: Nodira Market"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Telefon</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Yuridik nomi</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Ixtiyoriy"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">STIR</label>
                <input
                  type="text"
                  maxLength={9}
                  value={tin}
                  onChange={(e) => setTin(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="Ixtiyoriy, 9 raqam"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <PlatformLeadBusinessTypeChips
              selectedType={selectedType}
              onSelectType={setSelectedType}
              guessedLabel={guessedLabel}
            />
          </div>

          <PlatformLeadAdminSection
            leadName={lead.name}
            branchName={branchName}
            onBranchNameChange={setBranchName}
            createAdmin={createAdmin}
            onCreateAdminChange={setCreateAdmin}
            adminName={adminName}
            onAdminNameChange={setAdminName}
            adminLogin={adminLogin}
            onAdminLoginChange={setAdminLogin}
            markDone={markDone}
            onMarkDoneChange={setMarkDone}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              {!companyName.trim() ? 'Kompaniya nomini kiriting' : 'Kompaniya yaratishga tayyor'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={!companyName.trim() || isSubmitting}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-opacity disabled:opacity-40 hover:bg-slate-800 dark:bg-white dark:text-slate-900"
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
