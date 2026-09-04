import FloorTableNode from './FloorTableNode';
import { resolveFloorPositions } from '../utils/resolveFloorPositions';
import { useInfiniteScrollSlice } from '../../shared/hooks/useInfiniteScrollSlice';
import '../styles/floor-canvas.css';

const ADMIN_PAGE_SIZE = 24;

function sortTablesForScroll(tables) {
  return [...tables].sort((a, b) => {
    const dy = (Number(a.posY) || 0) - (Number(b.posY) || 0);
    if (dy !== 0) return dy;
    return (Number(a.posX) || 0) - (Number(b.posX) || 0);
  });
}

function scaleFloorTable(table, scale, minSize = 96) {
  return {
    ...table,
    posX: Math.round(table.posX * scale),
    posY: Math.round(table.posY * scale),
    width: Math.max(Math.round(table.width * scale), minSize),
    height: Math.max(Math.round(table.height * scale), Math.round(minSize * 0.85)),
  };
}

export default function FloorCanvas({
  hall,
  selectedTableId,
  onTableClick,
  t,
  variant = 'pos',
}) {
  const isAdmin = variant === 'admin';
  const scale = isAdmin ? 1.4 : 1.55;
  const minSize = isAdmin ? 96 : 128;
  const resolved = resolveFloorPositions(hall?.tables ?? []);
  const sorted = isAdmin ? sortTablesForScroll(resolved) : resolved;

  const {
    visibleItems,
    hasMore,
    rootRef,
    sentinelRef,
  } = useInfiniteScrollSlice(sorted, {
    pageSize: ADMIN_PAGE_SIZE,
    resetKey: hall?.id,
    rootMargin: '160px',
    enabled: isAdmin,
  });

  if (!hall) {
    return (
      <div className="rst-floor-canvas rst-floor-canvas--empty">
        <p>{t('rst.floor.selectHall')}</p>
      </div>
    );
  }

  if (resolved.length === 0) {
    return (
      <div className={`rst-floor-canvas rst-floor-canvas--empty${isAdmin ? ' rst-floor-canvas--admin' : ''}`}>
        <p>{t('rst.floor.noTables')}</p>
      </div>
    );
  }

  const tablesToRender = isAdmin ? visibleItems : resolved;
  const planeTables = (isAdmin ? sorted : resolved).map((table) => (
    scaleFloorTable(table, scale, minSize)
  ));
  const renderedTables = tablesToRender.map((table) => (
    scaleFloorTable(table, scale, minSize)
  ));
  const maxX = planeTables.reduce((acc, table) => Math.max(acc, table.posX + table.width), 0);
  const maxY = planeTables.reduce((acc, table) => Math.max(acc, table.posY + table.height), 0);
  const loadedMaxY = renderedTables.reduce(
    (acc, table) => Math.max(acc, table.posY + table.height),
    0,
  );

  return (
    <div
      ref={isAdmin ? rootRef : undefined}
      className={`rst-floor-canvas${isAdmin ? ' rst-floor-canvas--admin' : ' rst-floor-canvas--pos'}`}
    >
      <div
        className="rst-floor-canvas__plane"
        style={{
          minWidth: Math.max(isAdmin ? 980 : 880, maxX + 48),
          minHeight: Math.max(isAdmin ? 620 : 520, maxY + 48),
        }}
      >
        {renderedTables.map((node) => (
          <FloorTableNode
            key={node.id}
            table={node}
            selected={selectedTableId === node.id}
            onClick={onTableClick}
            t={t}
          />
        ))}
        {isAdmin && hasMore ? (
          <div
            ref={sentinelRef}
            className="rst-floor-canvas__sentinel"
            style={{ top: Math.max(0, loadedMaxY + 8) }}
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  );
}
