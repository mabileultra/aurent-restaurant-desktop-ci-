import React, { useState } from 'react';
import { Badge, Button, Card, KpiCard, Table } from '../../../components/aa';

/**
 * UI-Kit: Ma’lumotlar vizualizatsiyasi (KpiCard, Card, Table).
 */
export default function UiKitDataSection() {
  const [sort, setSort] = useState({ key: 'turnover', order: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState('1');

  const sampleRows = [
    { id: '1', name: 'Arent Retail Samarqand', stir: '302918231', type: 'Supermarket', turnover: '512,4 mln so‘m', status: 'ACTIVE' },
    { id: '2', name: 'Dori-Darmon Toshkent', stir: '305118492', type: 'Dorixona', turnover: '248,1 mln so‘m', status: 'ACTIVE' },
    { id: '3', name: 'Osh Markazi Buxoro', stir: '308992110', type: 'Restoran', turnover: '84,5 mln so‘m', status: 'INACTIVE' },
    { id: '4', name: 'Ziyo Savdo Andijon', stir: '301229481', type: 'Chakana', turnover: '12,9 mln so‘m', status: 'ACTIVE' },
  ];

  const columns = [
    {
      key: 'name',
      title: 'Korxona nomi',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="font-medium text-aa-ink">{val}</span>
          <span className="aa-table__sub">{row.type}</span>
        </div>
      ),
    },
    {
      key: 'stir',
      title: 'STIR',
      render: (val) => <span className="aa-id aa-num">{val}</span>,
    },
    {
      key: 'status',
      title: 'Holati',
      render: (val) => (
        <Badge tone={val === 'ACTIVE' ? 'success' : 'danger'} dot>
          {val === 'ACTIVE' ? 'Ulangan' : 'Ulanmagan'}
        </Badge>
      ),
    },
    {
      key: 'turnover',
      title: 'Aylanma (30 kun)',
      align: 'right',
      sortable: true,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-aa-section-title font-semibold text-aa-ink">5. Ko‘rsatkich kartalari (KpiCard)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Umumiy aylanma"
            value="4,71 mlrd"
            unit="so‘m"
            size="lg"
            delta={{ value: '12,4%', direction: 'up', text: 'o‘tgan oyga nisbatan' }}
            split={[
              { value: 72, tone: 'success', label: 'Fiskal ulush: 72%' },
              { value: 28, tone: 'danger', label: 'Fiskalsiz: 28%' },
            ]}
          />
          <KpiCard
            label="Faol korxonalar"
            value="1 428"
            delta={{ value: '3,1%', direction: 'down', text: 'so‘nggi haftada' }}
          />
          <KpiCard
            label="Kutilayotgan summa"
            value={null}
            meta="Hozircha ma’lumot yo‘q"
          />
          <KpiCard
            label="Yuklanayotgan ko‘rsatkich"
            loading
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-aa-section-title font-semibold text-aa-ink">6. Kartalar (Card) & Jadvallar (Table)</h2>
        <Card
          title="Korxonalar ro‘yxati"
          subtitle="Faol va ulanmagan savdo nuqtalari"
          actions={<Button size="sm" variant="secondary">Eksport</Button>}
          bodyFlush
        >
          <Table
            columns={columns}
            rows={sampleRows}
            selectedKey={selectedKey}
            onRowClick={(row) => setSelectedKey(row.id)}
            sort={sort}
            onSort={(k) => setSort((prev) => ({ key: k, order: prev.key === k && prev.order === 'asc' ? 'desc' : 'asc' }))}
            pagination={{
              page: currentPage,
              totalPages: 4,
              totalItems: 48,
              onPageChange: setCurrentPage,
            }}
          />
        </Card>
      </section>
    </div>
  );
}
