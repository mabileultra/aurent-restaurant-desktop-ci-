export default function PosZoomControls({ zoom, t }) {
  return (
    <div className="rst-pos__zoom" role="group" aria-label={t('rst.pos.zoomLabel')}>
      <button
        type="button"
        className="rst-pos__zoom-btn"
        onClick={zoom.zoomOut}
        disabled={!zoom.canZoomOut}
        aria-label={t('rst.pos.zoomOut')}
      >
        −
      </button>
      <button
        type="button"
        className="rst-pos__zoom-value"
        onClick={zoom.reset}
        aria-label={t('rst.pos.zoomReset')}
        title={t('rst.pos.zoomReset')}
      >
        <svg className="rst-pos__zoom-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M15.5 15.5 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>{zoom.percent}%</span>
      </button>
      <button
        type="button"
        className="rst-pos__zoom-btn"
        onClick={zoom.zoomIn}
        disabled={!zoom.canZoomIn}
        aria-label={t('rst.pos.zoomIn')}
      >
        +
      </button>
    </div>
  );
}
