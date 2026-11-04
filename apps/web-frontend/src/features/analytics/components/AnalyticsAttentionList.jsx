import React from 'react';
import { ChevronRight, FileText, Info, MapPin, Zap } from 'lucide-react';

export default function AnalyticsAttentionList({ onFilterAttention }) {
  return (
    <div className="an-card" aria-label="E’tibor talab qiladi">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">E’tibor talab qiladi</h3>
          <p className="an-card-sub">Tanlangan davr bo‘yicha nazorat ro‘yxati</p>
        </div>
      </div>

      <div className="an-attention-list">
        <div
          className="an-attention-item"
          role="button"
          tabIndex={0}
          onClick={() => onFilterAttention && onFilterAttention('NOT_CONNECTED_SELLING')}
          onKeyDown={(e) => e.key === 'Enter' && onFilterAttention && onFilterAttention('NOT_CONNECTED_SELLING')}
        >
          <div className="an-attention-icon an-attention-icon--red">
            <Zap size={18} strokeWidth={2.4} aria-hidden />
          </div>
          <div className="an-attention-body">
            <h4 className="an-attention-title">Savdo qilmoqda, lekin ulanmagan</h4>
            <p className="an-attention-text">9 ta firma · 65,7 mln so‘m fiskalsiz</p>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.15rem 0 0' }}>
              Sharks Avenue 37,0 mln · 404 Toys 26,9 mln
            </p>
          </div>
          <ChevronRight size={16} color="#94a3b8" aria-hidden />
        </div>

        <div
          className="an-attention-item"
          role="button"
          tabIndex={0}
          onClick={() => onFilterAttention && onFilterAttention('CONNECTED_NO_RECEIPTS')}
          onKeyDown={(e) => e.key === 'Enter' && onFilterAttention && onFilterAttention('CONNECTED_NO_RECEIPTS')}
        >
          <div className="an-attention-icon an-attention-icon--amber">
            <FileText size={18} strokeWidth={2.4} aria-hidden />
          </div>
          <div className="an-attention-body">
            <h4 className="an-attention-title">Ulangan, lekin fiskal chek yo‘q</h4>
            <p className="an-attention-text">12 ta firma · 30 kun ichida</p>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.15rem 0 0' }}>
              Niso Market: 8,4 mln faqat fiskalsiz
            </p>
          </div>
          <ChevronRight size={16} color="#94a3b8" aria-hidden />
        </div>

        <div
          className="an-attention-item"
          role="button"
          tabIndex={0}
          onClick={() => onFilterAttention && onFilterAttention('MISSING_REGION')}
          onKeyDown={(e) => e.key === 'Enter' && onFilterAttention && onFilterAttention('MISSING_REGION')}
        >
          <div className="an-attention-icon an-attention-icon--blue">
            <MapPin size={18} strokeWidth={2.4} aria-hidden />
          </div>
          <div className="an-attention-body">
            <h4 className="an-attention-title">Hududi ko‘rsatilmagan</h4>
            <p className="an-attention-text">49 ta firma · 205,2 mln so‘m aylanma</p>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.15rem 0 0' }}>
              Viloyatlar hisobotiga kirmayapti
            </p>
          </div>
          <ChevronRight size={16} color="#94a3b8" aria-hidden />
        </div>
      </div>

      <div style={{
        marginTop: '0.85rem',
        padding: '0.65rem 0.75rem',
        background: '#f8fafc',
        borderRadius: '0.55rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        fontSize: '0.75rem',
        color: '#475569',
      }}>
        <Info size={14} color="#047857" aria-hidden style={{ flexShrink: 0 }} />
        <span>Top-5 firma umumiy aylanmaning <strong>93,5%</strong> ini beradi</span>
      </div>
    </div>
  );
}
