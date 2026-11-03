import React, { useState } from 'react';
import { Phone, Send, Mail, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  buildTelLink,
  buildTelegramLink,
  buildMailtoLink,
  cleanPhone,
} from '../../utils/leadFormatUtils';

export default function PlatformLeadQuickActionsBar({ lead, t, isMobile = false }) {
  const [copied, setCopied] = useState(false);

  if (!lead) return null;

  const telLink = buildTelLink(lead.phone);
  const tgLink = buildTelegramLink(lead.phone);
  const mailtoLink = buildMailtoLink(lead.email);

  const handleCopyPhone = async () => {
    const raw = cleanPhone(lead.phone);
    if (!raw) return;
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      toast.success(t ? t('platform.leads.phoneCopied', { defaultValue: 'Raqam nusxalandi' }) : 'Raqam nusxalandi');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t ? t('platform.leads.phoneCopyFailed', { defaultValue: 'Raqamni nusxalab bo\'lmadi' }) : 'Raqamni nusxalab bo\'lmadi');
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-2.5">
        {/* Full-width green call button */}
        <a
          href={telLink}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-emerald-800 active:scale-[0.98]"
        >
          <Phone size={18} />
          <span>{lead.phone} ga qo'ng'iroq</span>
        </a>

        {/* 3 Large Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <a
            href={tgLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Send size={16} className="text-sky-500" />
            <span>Telegram</span>
          </a>
          <a
            href={mailtoLink}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 ${
              !lead.email ? 'pointer-events-none opacity-40' : ''
            }`}
          >
            <Mail size={16} className="text-slate-500" />
            <span>Email</span>
          </a>
          <button
            type="button"
            onClick={handleCopyPhone}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} className="text-slate-500" />}
            <span>{copied ? 'Nusxalandi' : 'Nusxa'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 1. Call Button */}
      <a
        href={telLink}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-800 active:scale-95"
      >
        <Phone size={15} />
        <span>{t ? t('platform.leads.call', { defaultValue: 'Qo\'ng\'iroq qilish' }) : 'Qo\'ng\'iroq qilish'}</span>
      </a>

      {/* 2. Telegram Button */}
      <a
        href={tgLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Send size={15} className="text-sky-500" />
        <span>Telegram</span>
      </a>

      {/* 3. Email Button */}
      <a
        href={mailtoLink}
        className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 ${
          !lead.email ? 'pointer-events-none opacity-40' : ''
        }`}
      >
        <Mail size={15} className="text-slate-500" />
        <span>Email</span>
      </a>

      {/* 4. Copy Phone */}
      <button
        type="button"
        onClick={handleCopyPhone}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
      >
        {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} className="text-slate-500" />}
        <span>{copied ? 'Nusxalandi' : (t ? t('platform.leads.copyPhone', { defaultValue: 'Raqamni nusxalash' }) : 'Raqamni nusxalash')}</span>
      </button>
    </div>
  );
}
