import { useEffect, useRef, useState } from 'react';
import FloorTableNode from './FloorTableNode';
import { resolveFloorPositions, TABLE_DEFAULT_SIZE } from '../utils/resolveFloorPositions';
import '../styles/floor-canvas.css';

const ADMIN_SCALE = 1.15;
const POS_SCALE = 1.55;
const DISPLAY_GRID = 48;

function scaleFloorTable(table, scale, minSize = 96, maxSize = Number.POSITIVE_INFINITY, uniform = false) {
  if (uniform) {
    return {
      ...table,
      posX: Math.round(table.posX * scale),
      posY: Math.round(table.posY * scale),
      width: minSize,
      height: minSize,
    };
  }
  const width = Math.min(Math.max(Math.round(table.width * scale), minSize), maxSize);
  const height = Math.min(
    Math.max(Math.round(table.height * scale), Math.round(minSize * 0.85)),
    maxSize,
  );
  return {
    ...table,
    posX: Math.round(table.posX * scale),
    posY: Math.round(table.posY * scale),
    width,
    height,
  };
}

function snapDisplay(value) {
  return Math.max(0, Math.round(value / DISPLAY_GRID) * DISPLAY_GRID);
}

function toServerCoord(displayValue, scale) {
  return Math.max(0, Math.round(displayValue / scale));
}

export default function FloorCanvas({
  hall,
  selectedTableId,
  onTableClick,
  onTableMove,
  waiterNameById,
  /** Optional: (table) => boolean — pickMode only. */
  isTableSelectable,
  t,
  variant = 'pos',
}) {
  const isAdmin = variant === 'admin';
  const isPick = variant === 'pick';
  const useStoredLayout = isAdmin || isPick;
  const scale = isAdmin || isPick ? ADMIN_SCALE : POS_SCALE;
  const minSize = isAdmin || isPick ? TABLE_DEFAULT_SIZE : 140;
  const maxSize = isAdmin || isPick ? TABLE_DEFAULT_SIZE : 140;
  const [draftPos, setDraftPos] = useState({});
  const dragRef = useRef(null);
  const onTableMoveRef = useRef(onTableMove);
  const onTableClickRef = useRef(onTableClick);
  onTableMoveRef.current = onTableMove;
  onTableClickRef.current = onTableClick;

  useEffect(() => {
    setDraftPos({});
  }, [hall?.id]);

  useEffect(() => {
    const onPointerMove = (event) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = event.clientX - drag.startClientX;
      const dy = event.clientY - drag.startClientY;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      drag.moved = true;
      const displayX = snapDisplay(drag.originDisplayX + dx);
      const displayY = snapDisplay(drag.originDisplayY + dy);
      const next = {
        posX: toServerCoord(displayX, drag.scale),
        posY: toServerCoord(displayY, drag.scale),
      };
      drag.lastPos = next;
      setDraftPos((prev) => ({ ...prev, [drag.tableId]: next }));
    };

    const onPointerUp = () => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      if (!drag.moved) {
        onTableClickRef.current?.(drag.sourceTable);
        return;
      }
      if (!drag.lastPos || !onTableMoveRef.current) return;
      onTableMoveRef.current({
        id: drag.tableId,
        posX: drag.lastPos.posX,
        posY: drag.lastPos.posY,
        width: TABLE_DEFAULT_SIZE,
        height: TABLE_DEFAULT_SIZE,
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  const baseTables = (hall?.tables ?? []).map((table) => {
    const draft = draftPos[table.id];
    return draft
      ? {
          ...table,
          posX: draft.posX,
          posY: draft.posY,
          width: TABLE_DEFAULT_SIZE,
          height: TABLE_DEFAULT_SIZE,
        }
      : table;
  });
  // Admin / pick schema: stored coords as-is (match admin layout).
  const resolved = useStoredLayout
    ? baseTables.map((table) => ({
        ...table,
        posX: Math.round(Number(table.posX) || 0),
        posY: Math.round(Number(table.posY) || 0),
        width: Number(table.width) || TABLE_DEFAULT_SIZE,
        height: Number(table.height) || TABLE_DEFAULT_SIZE,
      }))
    : resolveFloorPositions(baseTables);

  if (!hall) {
    return (
      <div className="rst-floor-canvas rst-floor-canvas--empty">
        <p>{t('rst.floor.selectHall')}</p>
      </div>
    );
  }

  if (resolved.length === 0) {
    return (
      <div className={`rst-floor-canvas rst-floor-canvas--empty${isAdmin || isPick ? ' rst-floor-canvas--admin' : ''}`}>
        <p>{t('rst.floor.noTables')}</p>
      </div>
    );
  }

  const scaleOpts = [scale, minSize, maxSize, !useStoredLayout];
  const planeTables = resolved.map((table) => scaleFloorTable(table, ...scaleOpts));
  const maxX = planeTables.reduce((acc, table) => Math.max(acc, table.posX + table.width), 0);
  const maxY = planeTables.reduce((acc, table) => Math.max(acc, table.posY + table.height), 0);

  const startDrag = (event, table, displayTable) => {
    // Click opens the table. Opening on pointerdown paints the modal under the
    // finger, and the same tap hits the backdrop and closes it.
    if (!isAdmin || !onTableMove) return;
    event.preventDefault();
    dragRef.current = {
      tableId: table.id,
      sourceTable: table,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originDisplayX: displayTable.posX,
      originDisplayY: displayTable.posY,
      scale,
      moved: false,
      lastPos: null,
    };
  };

  return (
    <div
      className={[
        'rst-floor-canvas',
        isAdmin || isPick ? 'rst-floor-canvas--admin' : 'rst-floor-canvas--pos',
        isAdmin ? 'rst-floor-canvas--editable' : '',
        isPick ? 'rst-floor-canvas--pick' : '',
      ].filter(Boolean).join(' ')}
    >
      <div
        className="rst-floor-canvas__plane"
        style={{
          minWidth: Math.max(isAdmin || isPick ? 980 : 880, maxX + 48),
          minHeight: Math.max(isAdmin || isPick ? 620 : 520, maxY + 48),
        }}
      >
        {planeTables.map((node) => {
          const source = resolved.find((row) => row.id === node.id) ?? node;
          const order = (source.activeOrders?.[0] || source.activeOrder) ?? null;
          const waiterLabel = order?.waiterUserId != null
            ? (waiterNameById?.get(String(order.waiterUserId)) || t('rst.floor.waiterUnknown'))
            : null;
          const pickSelectable = isPick && typeof isTableSelectable === 'function'
            ? isTableSelectable(source)
            : null;
          return (
            <FloorTableNode
              key={node.id}
              table={node}
              selected={selectedTableId === node.id}
              draggable={isAdmin && !!onTableMove}
              pickMode={isPick}
              pickSelectable={pickSelectable}
              waiterLabel={isPick ? waiterLabel : null}
              onPointerDown={(event) => startDrag(event, source, node)}
              onClick={isAdmin && onTableMove ? undefined : onTableClick}
              t={t}
            />
          );
        })}
      </div>
    </div>
  );
}
