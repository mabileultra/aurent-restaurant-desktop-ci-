import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Copy, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../../../components/aa/Badge';
import Button from '../../../components/aa/Button';
import { formatUzPhone } from '../../../utils/phoneUz';

/**
 * PlatformCompanyQuickDrawerDetails — Tezkor ko‘rish ichidagi ma’lumotlar (dl) va havola-qator.
 */
export default function PlatformCompanyQuickDrawerDetails({
  company,
  regionLabel,
  assignedTypes = [],
  t,
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTin, setCopiedTin] = useState(false);

  const cleanTin = company?.tin && /^\d+$/.test(String(company.tin).trim()) ? String(company.tin).trim() : null;
  const formattedPhone = company?.phone ? formatUzPhone(company.phone) : null;

  const handleCopy = (text, type) => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast.success('Kirish kodi nusxalandi');
    } else {
      setCopiedTin(true);
      setTimeout(() => setCopiedTin(false), 2000);
      toast.success('STIR nusxalandi');
    }
  };

  const mainTypeName = t
    ? t(`productTemplates.businessTypes.${company?.businessType ?? 'UNIVERSAL'}`, {
        defaultValue: company?.businessType || 'Universal',
      })
    : company?.businessType || 'Universal';

  return (
    <div className="space-y-5">
      {/* Ma’lumotlar ro‘yxati (dl) */}
      <dl className="border border-aa-line rounded-aa-lg overflow-hidden divide-y divide-aa-line bg-aa-surface">
        {/* Kirish kodi */}
        <div className="min-h-[52px] p-3 sm:px-4 flex items-center gap-3">
          <dt className="w-[120px] shrink-0 text-xs font-semibold text-aa-ink-muted">
            Kirish kodi
          </dt>
          <dd className="flex-1 min-w-0 flex items-center gap-1.5 justify-start">
            <span
              className="font-mono font-normal text-[13px] text-aa-ink"
              style={{ fontFamily: 'var(--aa-font-mono)', fontWeight: 400 }}
            >
              {company?.loginCode || '—'}
            </span>
            {company?.loginCode ? (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon={copiedCode ? <Check size={14} className="text-aa-success" /> : <Copy size={14} />}
                aria-label="Kirish kodini nusxalash"
                onClick={() => handleCopy(company.loginCode, 'code')}
                className="h-8 w-8 !p-0"
              />
            ) : null}
          </dd>
        </div>

        {/* STIR */}
        <div className="min-h-[52px] p-3 sm:px-4 flex items-center gap-3">
          <dt className="w-[120px] shrink-0 text-xs font-semibold text-aa-ink-muted">
            STIR
          </dt>
          <dd className="flex-1 min-w-0 flex items-center gap-1.5 justify-start">
            <span
              className="font-mono font-normal text-[13px] text-aa-ink"
              style={{ fontFamily: 'var(--aa-font-mono)', fontWeight: 400 }}
            >
              {cleanTin || '—'}
            </span>
            {cleanTin ? (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon={copiedTin ? <Check size={14} className="text-aa-success" /> : <Copy size={14} />}
                aria-label="STIR raqamini nusxalash"
                onClick={() => handleCopy(cleanTin, 'tin')}
                className="h-8 w-8 !p-0"
              />
            ) : null}
          </dd>
        </div>

        {/* Telefon */}
        <div className="min-h-[52px] p-3 sm:px-4 flex items-center gap-3">
          <dt className="w-[120px] shrink-0 text-xs font-semibold text-aa-ink-muted">
            Telefon
          </dt>
          <dd className="flex-1 min-w-0 text-left text-sm font-medium text-aa-ink truncate">
            {formattedPhone ? (
              <a href={`tel:${company.phone}`} className="hover:underline text-aa-ink">
                {formattedPhone}
              </a>
            ) : (
              '—'
            )}
          </dd>
        </div>

        {/* Faoliyat turi */}
        <div className="min-h-[52px] p-3 sm:px-4 flex items-center gap-3">
          <dt className="w-[120px] shrink-0 text-xs font-semibold text-aa-ink-muted">
            Faoliyat turi
          </dt>
          <dd className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5 justify-start">
            <Badge tone="neutral">{mainTypeName}</Badge>
            <Badge tone="brand">Asosiy</Badge>
            {assignedTypes
              .filter((bt) => bt.code !== company?.businessType)
              .map((bt) => (
                <Badge key={bt.id || bt.code} tone="neutral">
                  {bt.name || bt.code}
                </Badge>
              ))}
          </dd>
        </div>

        {/* Manzil */}
        <div className="min-h-[52px] p-3 sm:px-4 flex items-center gap-3">
          <dt className="w-[120px] shrink-0 text-xs font-semibold text-aa-ink-muted">
            Manzil
          </dt>
          <dd className="flex-1 min-w-0 text-left text-sm">
            <div className="font-medium text-aa-ink">
              {regionLabel || '—'}
            </div>
            <div className="text-xs text-aa-ink-muted mt-0.5">
              {company?.address || 'Aniq manzil kiritilmagan'}
            </div>
          </dd>
        </div>
      </dl>

      {/* 52px havola-qator: Filiallarni ko‘rish */}
      <Link
        to={`/platform/stores?focusCompany=${company?.id}#company-${company?.id}`}
        className="h-[52px] px-4 flex items-center justify-between border border-aa-line rounded-aa-lg bg-aa-surface hover:bg-aa-surface-hover text-aa-ink transition-colors group cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <Store size={16} className="text-aa-ink-muted group-hover:text-aa-brand transition-colors" />
          <span className="text-sm font-semibold">Filiallarni ko‘rish</span>
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-aa-full text-xs font-semibold tabular-nums bg-aa-surface-sunken text-aa-ink-muted">
            {company?.storeCount ?? 0}
          </span>
        </div>
        <ArrowRight size={16} className="text-aa-ink-muted group-hover:text-aa-brand transition-colors" />
      </Link>
    </div>
  );
}
