import React from 'react';
import { fmtMoney } from '../utils/analyticsFormat';

export default function AnalyticsTurnoverTooltip({
  point,
  leftPct = 0,
  isRightHalf = false,
  isVisible = false,
}) {
  if (!point) return null;

  return (
    <div
      className="an-turnover-tooltip"
      style={{
        left: `${leftPct}%`,
        transform: isRightHalf ? 'translateX(calc(-100% - 14px))' : 'translateX(14px)',
        opacity: isVisible ? 1 : 0.95,
      }}
    >
      <div className="an-turnover-tooltip__date">{point.fullDate}</div>
      <div className="an-turnover-tooltip__row">
        <span className="an-turnover-tooltip__label">Fiskal</span>
        <span className="an-turnover-tooltip__val">{fmtMoney(point.fiscal, { showCurrency: false })}</span>
      </div>
      <div className="an-turnover-tooltip__row">
        <span className="an-turnover-tooltip__label">Nofiskal</span>
        <span className="an-turnover-tooltip__val">{fmtMoney(point.nonFiscal, { showCurrency: false })}</span>
      </div>
      <div className="an-turnover-tooltip__divider" />
      <div className="an-turnover-tooltip__row an-turnover-tooltip__row--total">
        <span className="an-turnover-tooltip__label-total">Jami</span>
        <span className="an-turnover-tooltip__val-total">{fmtMoney(point.total, { showCurrency: false })}</span>
      </div>
      <div className="an-turnover-tooltip__meta">
        Eng katta ulush: {point.topFirm}
        {point.topSharePct > 0 ? ` · ${point.topSharePct}%` : ''}
        <br />· 7 kunlik o‘rtacha {fmtMoney(point.avg7, { showCurrency: false })}
      </div>
    </div>
  );
}
