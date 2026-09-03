import FloorTableNode from './FloorTableNode';
import { resolveFloorPositions } from '../utils/resolveFloorPositions';
import '../styles/floor-canvas.css';

export default function FloorCanvas({ hall, selectedTableId, onTableClick, t }) {
  if (!hall) {
    return (
      <div className="rst-floor-canvas rst-floor-canvas--empty">
        <p>{t('rst.floor.selectHall')}</p>
      </div>
    );
  }

  const tables = resolveFloorPositions(hall.tables ?? []);

  if (tables.length === 0) {
    return (
      <div className="rst-floor-canvas rst-floor-canvas--empty">
        <p>{t('rst.floor.noTables')}</p>
      </div>
    );
  }

  return (
    <div className="rst-floor-canvas">
      <div className="rst-floor-canvas__plane">
        {tables.map((table) => (
          <FloorTableNode
            key={table.id}
            table={table}
            selected={selectedTableId === table.id}
            onClick={onTableClick}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
