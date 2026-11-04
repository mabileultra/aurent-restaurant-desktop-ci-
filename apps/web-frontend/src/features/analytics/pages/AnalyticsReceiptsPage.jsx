import React, { useState } from 'react';
import '../styles/analytics.css';
import { Search, Download, QrCode, Printer, X } from 'lucide-react';
import AnalyticsHeader from '../components/AnalyticsHeader';
import AnalyticsTabs from '../components/AnalyticsTabs';
import { useAnalyticsOverview } from '../hooks/useAnalyticsOverview';

const RECEIPTS = [
  { id: 'RCP-20261024-0200', date: '24.10.2026', time: '15:26', company: 'Farina Invest', store: 'Farina Invest', amount: '24,7 mln', hasQr: true, op: 'Sotuv', items: [
    { name: 'Un birinchi nav 50kg', qty: 50, price: '380 000', total: '19 000 000' },
    { name: 'O‘simlik yog‘i 5L', qty: 30, price: '95 000', total: '2 850 000' },
    { name: 'Shakar 50kg', qty: 5, price: '570 000', total: '2 850 000' },
  ]},
  { id: 'RCP-20261024-0199', date: '24.10.2026', time: '14:52', company: 'Farina Invest', store: 'Farina Invest', amount: '18,5 mln', hasQr: true, op: 'Sotuv', items: [
    { name: 'Un oliy nav 50kg', qty: 35, price: '420 000', total: '14 700 000' },
    { name: 'Makaron mahsulotlari 20kg', qty: 20, price: '190 000', total: '3 800 000' },
  ]},
  { id: 'RCP-20261024-0198', date: '24.10.2026', time: '14:10', company: 'Farina Invest', store: 'Farina Invest', amount: '32,1 mln', hasQr: true, op: 'Sotuv', items: [
    { name: 'Un birinchi nav 50kg', qty: 80, price: '380 000', total: '30 400 000' },
    { name: 'Guruch lazer 25kg', qty: 3, price: '566 000', total: '1 700 000' },
  ]},
  { id: 'RCP-20261024-0197', date: '24.10.2026', time: '13:44', company: 'Farina Invest', store: 'Farina Invest', amount: '12,4 mln', hasQr: true, op: 'Sotuv', items: [
    { name: 'O‘simlik yog‘i 5L', qty: 130, price: '95 000', total: '12 350 000' },
  ]},
  { id: 'RCP-20261024-0196', date: '24.10.2026', time: '12:30', company: 'Farina Invest', store: 'Farina Invest', amount: '8,9 mln', hasQr: true, op: 'Sotuv', items: [
    { name: 'Tuxum C1 360 dona', qty: 10, price: '420 000', total: '4 200 000' },
    { name: 'Sariyog‘ 82.5% 10kg', qty: 5, price: '940 000', total: '4 700 000' },
  ]},
];

export default function AnalyticsReceiptsPage() {
  const page = useAnalyticsOverview();
  const [search, setSearch] = useState('');
  const [qrFilter, setQrFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(RECEIPTS[0]);

  return (
    <div className="an-container">
      <AnalyticsHeader
        period={page.period}
        setPeriod={page.setPeriod}
        customFrom={page.customFrom}
        customTo={page.customTo}
        onCustomChange={page.handleCustomDateChange}
      />

      <AnalyticsTabs />

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div style={{ position: 'relative', flex: '0 1 240px', minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#9CA3AF' }} />
          <input
            type="search"
            placeholder="Chek raqami"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', height: '34px', padding: '0 10px 0 32px', border: '1px solid #E5E9EE', borderRadius: '9px', fontSize: '12.5px', background: '#fff', color: '#1F2937' }}
          />
        </div>
        <button type="button" className="f">Hudud: <b>Samarqand viloyati</b></button>
        <button type="button" className="f">Korxona: <b>Farina Invest</b></button>
        <button type="button" className="f">Do‘kon: <b>Farina Invest</b></button>
        <div className="seg" role="group" aria-label="QR">
          <button type="button" className={qrFilter === 'all' ? 'on' : ''} onClick={() => setQrFilter('all')}>Barchasi</button>
          <button type="button" className={qrFilter === 'qr' ? 'on' : ''} onClick={() => setQrFilter('qr')}>QR bilan</button>
          <button type="button" className={qrFilter === 'no_qr' ? 'on' : ''} onClick={() => setQrFilter('no_qr')}>QR’siz</button>
        </div>
        <span style={{ flex: '1 1 auto' }} />
        <button type="button" className="btn">
          <Download size={14} style={{ color: '#2563EB' }} />
          Excel · 51 qator
        </button>
      </div>

      {/* 4 Summary Cards */}
      <section aria-label="Cheklar xulosasi" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div className="card" style={{ padding: '12px 16px' }}><div className="k">Cheklar soni</div><div style={{ fontSize: '21px', fontWeight: 700 }}>51</div></div>
        <div className="card" style={{ padding: '12px 16px' }}><div className="k">Cheklar summasi</div><div style={{ fontSize: '21px', fontWeight: 700 }}>1,19 mlrd</div></div>
        <div className="card" style={{ padding: '12px 16px' }}><div className="k">O‘rtacha chek</div><div style={{ fontSize: '21px', fontWeight: 700 }}>23,3 mln</div></div>
        <div className="card" style={{ padding: '12px 16px' }}><div className="k">Korxona · do‘kon</div><div style={{ fontSize: '15px', fontWeight: 650, marginTop: '4px' }}>Farina Invest · 1 do‘kon</div></div>
      </section>

      {/* 2 Columns: Table on Left, Detail on Right */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
        {/* Table */}
        <section className="card" aria-label="Cheklar ro‘yxati" style={{ flex: '3 1 620px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="tb">
              <thead>
                <tr>
                  <th>Chek raqami</th>
                  <th>Sana</th>
                  <th>Vaqt ↓</th>
                  <th>Korxona</th>
                  <th>Do‘kon</th>
                  <th className="r">Summa</th>
                  <th>QR</th>
                  <th>Operatsiya</th>
                </tr>
              </thead>
              <tbody>
                {RECEIPTS.map((r) => {
                  const isSelected = selectedReceipt?.id === r.id;
                  return (
                    <tr
                      key={r.id}
                      style={{ background: isSelected ? '#F5F8FF' : '#ffffff', cursor: 'pointer' }}
                      onClick={() => setSelectedReceipt(r)}
                    >
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ color: '#2563EB' }}>{r.id}</span>
                      </td>
                      <td>{r.date}</td>
                      <td>{r.time}</td>
                      <td>{r.company}</td>
                      <td style={{ color: '#4B5563' }}>{r.store}</td>
                      <td className="r" style={{ fontWeight: 600 }}>{r.amount}</td>
                      <td><span className="badge ok"><QrCode size={11} />QR bilan</span></td>
                      <td><span className="badge info">{r.op}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderTop: '1px solid #E5E9EE', fontSize: '12.5px', color: '#6B7280' }}>
            <span>1–5 / 51 chek</span>
            <span>1 / 10 sahifa</span>
          </div>
        </section>

        {/* Selected Receipt Detail Drawer */}
        {selectedReceipt && (
          <aside className="card" style={{ flex: '2 1 360px', minWidth: 0, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px', borderColor: '#C9DAFB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="k">Chek detalizatsiyasi</div>
                <h3 className="t" style={{ fontSize: '17px', marginTop: '2px' }}>{selectedReceipt.id}</h3>
              </div>
              <button type="button" className="btn" aria-label="Yopish" style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center' }} onClick={() => setSelectedReceipt(null)}>
                <X size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', background: '#F5F8FF' }}>
              <span className="k">Chek summasi</span>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937' }}>{selectedReceipt.amount} so‘m</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>Sana va vaqt:</span>
                <span>{selectedReceipt.date} · {selectedReceipt.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>Korxona:</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.company}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>QR holati:</span>
                <span className="badge ok">QR bilan</span>
              </div>
            </div>

            {/* Items table */}
            <div style={{ borderTop: '1px solid #E5E9EE', paddingTop: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 650 }}>Chek tarkibi</span>
              <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedReceipt.items?.map((item) => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '4px' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.name}</div>
                      <div style={{ color: '#64748b' }}>{item.qty} dona × {item.price}</div>
                    </div>
                    <strong style={{ alignSelf: 'center' }}>{item.total}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
              <button type="button" className="btn" style={{ flex: '1 1 0', justifyContent: 'center' }}>
                <QrCode size={14} style={{ color: '#2563EB' }} />
                QR kod
              </button>
              <button type="button" className="btn" style={{ flex: '1 1 0', justifyContent: 'center' }}>
                <Printer size={14} />
                Chop etish
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
