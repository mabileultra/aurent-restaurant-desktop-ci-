import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Badge, Button, FilterChip, Segmented, Skeleton } from '../../../components/aa';

/**
 * UI-Kit: Tugmalar, nishonlar, segmentlar va chip'lar bo‘limi.
 */
export default function UiKitButtonsBadgesSection() {
  const [segValue, setSegValue] = useState('all');
  const [chip1, setChip1] = useState(true);
  const [chip2, setChip2] = useState(false);

  const segOptions = [
    { value: 'all', label: 'Hammasi', count: 48 },
    { value: 'grocery', label: 'Oziq-ovqat', count: 24 },
    { value: 'pharmacy', label: 'Dorixonalar', count: 16 },
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-aa-section-title font-semibold text-aa-ink">1. Tugmalar (Button)</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Asosiy amal</Button>
          <Button variant="secondary">Ikkinchi darajali</Button>
          <Button variant="ghost">Ghost tugma</Button>
          <Button variant="danger">Xavfli amal</Button>
          <Button variant="analytics">Analitika tugmasi</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" icon={<Plus className="aa-icon" />}>Kichik (sm)</Button>
          <Button size="md">Standart (md)</Button>
          <Button size="lg">Katta (lg)</Button>
          <Button iconOnly icon={<Trash2 className="aa-icon" />} aria-label="O‘chirish" variant="secondary" />
          <Button loading variant="primary">Yuklanmoqda</Button>
          <Button disabled variant="secondary">Nofaol tugma</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-aa-section-title font-semibold text-aa-ink">2. Holat nishonlari (Badge)</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">Neytral</Badge>
          <Badge tone="success" dot>Ulangan</Badge>
          <Badge tone="warning" dot>Kutilmoqda</Badge>
          <Badge tone="danger" dot>Ulanmagan</Badge>
          <Badge tone="info">Yangi</Badge>
          <Badge tone="brand">Brend</Badge>
          <Badge tone="analytics">Analitika</Badge>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-aa-section-title font-semibold text-aa-ink">3. Segmented & FilterChip & Skeleton</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Segmented options={segOptions} value={segValue} onChange={setSegValue} />
          <Segmented options={segOptions} value={segValue} onChange={setSegValue} accent="analytics" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterChip pressed={chip1} onToggle={() => setChip1(!chip1)} count={12}>Fiskal</FilterChip>
          <FilterChip pressed={chip2} onToggle={() => setChip2(!chip2)} count={4} accent="analytics">Analitika</FilterChip>
          <FilterChip pressed={false} count={0}>Bo‘sh</FilterChip>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md pt-2">
          <Skeleton variant="text" />
          <Skeleton variant="metric" />
          <Skeleton variant="row" />
        </div>
      </section>
    </div>
  );
}
