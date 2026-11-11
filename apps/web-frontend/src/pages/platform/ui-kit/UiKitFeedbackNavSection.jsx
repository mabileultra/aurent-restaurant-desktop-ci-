import React, { useState } from 'react';
import { BarChart3, Building2, Store } from 'lucide-react';
import { Alert, Button, EmptyState, Modal, NavItem, PageHeader } from '../../../components/aa';

/**
 * UI-Kit: Ogohlantirishlar, modal, navigatsiya va bo‘sh holatlar bo‘limi.
 */
export default function UiKitFeedbackNavSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [dangerModalOpen, setDangerModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-aa-section-title font-semibold text-aa-ink">7. Ogohlantirishlar (Alert)</h2>
        <div className="space-y-2.5">
          <Alert tone="info" title="Ma’lumot">
            Yangi hisobot shakllantirish jarayoni fonda davom etmoqda.
          </Alert>
          <Alert tone="success" title="Muvaffaqiyatli saqlandi">
            Kompaniya ma’lumotlari muvaffaqiyatli yangilandi.
          </Alert>
          <Alert tone="warning" title="E’tibor bering">
            Ushbu korxonada oxirgi 7 kunda fiskal chek urilmadi.
          </Alert>
          <Alert
            tone="danger"
            title="Aloqa xatoligi"
            action={<Button size="sm" variant="danger">Qayta urinish</Button>}
          >
            Server bilan ulanish uzildi. Iltimos internet aloqasini tekshiring.
          </Alert>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-aa-section-title font-semibold text-aa-ink">8. Bo‘sh holat (EmptyState) & Modal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-aa-lg border border-aa-line bg-aa-surface">
            <EmptyState
              title="Bu davrda savdo yo‘q"
              text="Tanlangan filtrlar bo‘yicha hech qanday operatsiya topilmadi. Davrni o‘zgartirib ko‘ring."
              actions={<Button variant="secondary" size="sm">Filtrlarni tozalash</Button>}
            />
          </div>

          <div className="flex flex-col items-center justify-center p-6 rounded-aa-lg border border-aa-line bg-aa-surface gap-3">
            <p className="text-aa-ink-muted text-sm text-center">
              Modal oynalar `createPortal` orqali ochiladi, Esc bilan yopiladi va fokus tuzog‘iga ega.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setModalOpen(true)}>Standart modalni ochish</Button>
              <Button variant="danger" onClick={() => setDangerModalOpen(true)}>Xavfli modal</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-aa-section-title font-semibold text-aa-ink">9. Navigatsiya (PageHeader & NavItem)</h2>
        <div className="p-4 rounded-aa-lg border border-aa-line bg-aa-surface space-y-4">
          <PageHeader
            breadcrumbs={[
              { label: 'Analitika', to: '/platform/analytics' },
              { label: 'Viloyatlar', to: '/platform/analytics/viloyatlar' },
              { label: 'Samarqand' },
            ]}
            title="Samarqand viloyati"
            meta={<span className="text-aa-ink-muted text-sm">16 ta tuman · 1 428 korxona</span>}
            actions={<Button variant="analytics">Hisobotni yuklab olish</Button>}
          />

          <div className="pt-2">
            <h3 className="text-aa-card-title font-medium text-aa-ink-muted mb-2">Sidebar NavItem namunalari:</h3>
            <div className="w-64 border border-aa-line rounded-aa-md p-2 bg-aa-surface space-y-1">
              <NavItem icon={<Building2 className="aa-icon" />} label="Kompaniyalar" active as="button" count={48} />
              <NavItem icon={<Store className="aa-icon" />} label="Do‘konlar" as="button" count={12} />
              <NavItem icon={<BarChart3 className="aa-icon" />} label="Analitika" accent="analytics" active as="button" />
            </div>
          </div>
        </div>
      </section>

      {/* Standart modal */}
      <Modal
        open={modalOpen}
        title="Yangi korxona qo‘shish"
        onClose={() => setModalOpen(false)}
        primaryAction={{ label: 'Saqlash', onClick: () => setModalOpen(false) }}
        secondaryAction={{ label: 'Bekor qilish', onClick: () => setModalOpen(false) }}
      >
        <p className="text-sm text-aa-ink-muted">
          Bu standart modal namunasi. Klaviaturadan Tab va Shift+Tab orqali fokus faqat modal ichida aylanadi.
        </p>
      </Modal>

      {/* Xavfli modal */}
      <Modal
        open={dangerModalOpen}
        title="Kompaniyani o‘chirish"
        danger
        onClose={() => setDangerModalOpen(false)}
        primaryAction={{ label: 'Ha, o‘chirilsin', onClick: () => setDangerModalOpen(false) }}
        secondaryAction={{ label: 'Bekor qilish', onClick: () => setDangerModalOpen(false) }}
      >
        <p className="text-sm text-aa-danger">
          Ushbu amalni ortga qaytarib bo‘lmaydi. Barcha tegishli do‘konlar va terminallar o‘chiriladi.
        </p>
      </Modal>
    </div>
  );
}
