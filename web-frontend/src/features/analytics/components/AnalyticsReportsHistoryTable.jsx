import React from 'react';
import { Download } from 'lucide-react';

export default function AnalyticsReportsHistoryTable({ history = [], onDownload }) {
  return (
    <section className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #E5E9EE' }}>
        <h2 className="t">Eksport tarixi</h2>
        <p className="s">Oxirgi yaratilgan hisobotlar ro‘yxati</p>
      </div>
      <div className="an-table-wrap">
        <table className="an-table">
          <thead>
            <tr>
              <th>Hisobot</th>
              <th>Davr</th>
              <th>Filtrlar</th>
              <th>Qatorlar</th>
              <th>Format</th>
              <th>Holat</th>
              <th style={{ width: '120px' }} />
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
                  Hozircha hisobot yaratilmagan. Yuqoridagi tugma orqali hisobot yarating.
                </td>
              </tr>
            ) : (
              history.map((eh) => (
                <tr key={eh.id}>
                  <td style={{ fontWeight: 600 }}>{eh.report}</td>
                  <td>{eh.period}</td>
                  <td style={{ color: '#4B5563' }}>{eh.filters}</td>
                  <td>{eh.rows}</td>
                  <td>{eh.format}</td>
                  <td><span className="badge ok">Tayyor</span></td>
                  <td className="r">
                    <button
                      type="button"
                      className="btn"
                      style={{ height: '30px' }}
                      onClick={() => onDownload && onDownload(eh)}
                    >
                      <Download size={12} /> Yuklab olish
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
