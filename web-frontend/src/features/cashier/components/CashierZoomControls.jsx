export default function CashierZoomControls({ zoom, t }) {
  return (
    <div className="cashier-zoom" role="group" aria-label={t('pos.zoomLabel')}>
      <button
        type="button"
        className="cashier-zoom__btn"
        onClick={zoom.zoomOut}
        disabled={!zoom.canZoomOut}
        aria-label={t('pos.zoomOut')}
      >
        −
      </button>
      <button
        type="button"
        className="cashier-zoom__value"
        onClick={zoom.reset}
        aria-label={t('pos.zoomReset')}
        title={t('pos.zoomReset')}
      >
        <svg className="cashier-zoom__icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M15.5 15.5 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>{zoom.percent}%</span>
      </button>
      <button
        type="button"
        className="cashier-zoom__btn"
        onClick={zoom.zoomIn}
        disabled={!zoom.canZoomIn}
        aria-label={t('pos.zoomIn')}
      >
        +
      </button>
    </div>
  );
}
