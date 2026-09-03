const TABLE_DEFAULT_SIZE = 96;
const TABLE_GRID_GAP = 20;
const TABLE_GRID_COLUMNS = 4;
const TABLE_ORIGIN_X = 24;
const TABLE_ORIGIN_Y = 24;

function posKey(x, y) {
  return `${Math.round(Number(x) || 0)}:${Math.round(Number(y) || 0)}`;
}

export function gridSlot(index, size = TABLE_DEFAULT_SIZE) {
  const col = index % TABLE_GRID_COLUMNS;
  const row = Math.floor(index / TABLE_GRID_COLUMNS);
  return {
    posX: TABLE_ORIGIN_X + col * (size + TABLE_GRID_GAP),
    posY: TABLE_ORIGIN_Y + row * (size + TABLE_GRID_GAP),
  };
}

export function resolveFloorPositions(tables = []) {
  if (!Array.isArray(tables) || tables.length === 0) return tables;

  const sorted = [...tables].sort((a, b) =>
    String(a.code ?? '').localeCompare(String(b.code ?? ''), undefined, { numeric: true }),
  );

  const byPos = new Map();
  for (const table of sorted) {
    const key = posKey(table.posX, table.posY);
    if (!byPos.has(key)) byPos.set(key, []);
    byPos.get(key).push(table);
  }

  const hasOverlap = [...byPos.values()].some((group) => group.length > 1);
  if (!hasOverlap) {
    return tables.map((table) => ({
      ...table,
      posX: Math.round(Number(table.posX) || 0),
      posY: Math.round(Number(table.posY) || 0),
      width: Number(table.width) || TABLE_DEFAULT_SIZE,
      height: Number(table.height) || TABLE_DEFAULT_SIZE,
    }));
  }

  const used = new Set();
  const resolved = new Map();
  const claimNextFree = (preferredSize) => {
    const size = preferredSize || TABLE_DEFAULT_SIZE;
    for (let i = 0; i < 256; i += 1) {
      const slot = gridSlot(i, TABLE_DEFAULT_SIZE);
      const key = posKey(slot.posX, slot.posY);
      if (used.has(key)) continue;
      used.add(key);
      return { posX: slot.posX, posY: slot.posY, width: size, height: size };
    }
    return { posX: TABLE_ORIGIN_X, posY: TABLE_ORIGIN_Y, width: size, height: size };
  };

  for (const group of byPos.values()) {
    if (group.length === 1) {
      const table = group[0];
      const posX = Math.round(Number(table.posX) || 0);
      const posY = Math.round(Number(table.posY) || 0);
      used.add(posKey(posX, posY));
      resolved.set(table.id, {
        ...table,
        posX,
        posY,
        width: Number(table.width) || TABLE_DEFAULT_SIZE,
        height: Number(table.height) || TABLE_DEFAULT_SIZE,
      });
      continue;
    }
    for (const table of group) {
      const size = Math.max(
        Number(table.width) || TABLE_DEFAULT_SIZE,
        Number(table.height) || TABLE_DEFAULT_SIZE,
        TABLE_DEFAULT_SIZE,
      );
      resolved.set(table.id, { ...table, ...claimNextFree(size) });
    }
  }

  return sorted.map((table) => resolved.get(table.id) ?? table);
}

export { TABLE_DEFAULT_SIZE, TABLE_GRID_GAP, TABLE_GRID_COLUMNS };
