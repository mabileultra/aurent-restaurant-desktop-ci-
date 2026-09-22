import FloorCanvas from '../../pos/components/FloorCanvas';
import FloorStatusLegend from '../../pos/components/FloorStatusLegend';
import '../styles/halls-admin.css';

export default function HallsPlanPanel({ hall, onTableClick, t }) {
  return (
    <div className="rst-halls__pane rst-halls__pane--plan">
      <div className="rst-halls__pane-head">
        <strong>{t('rst.admin.hallPlan')}</strong>
        <span>{hall?.name || t('rst.floor.selectHall')}</span>
      </div>
      <div className="rst-halls__pane-body">
        <FloorCanvas
          variant="admin"
          hall={hall}
          onTableClick={onTableClick}
          t={t}
        />
        <div className="rst-halls__legend-wrap">
          <FloorStatusLegend t={t} />
        </div>
      </div>
    </div>
  );
}
