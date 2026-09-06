const TABLE_DEFAULT_SIZE = 96;
const TABLE_GRID_GAP = 20;
const TABLE_GRID_COLUMNS = 4;
const TABLE_ORIGIN_X = 24;
const TABLE_ORIGIN_Y = 24;

function posKey(x, y) {
  return `${Math.round(Number(x) || 0)}:${Math.round(Number(y) || 0)}`;
}

function normalizeTable(table) {
  return {
    ...table,
    posX: Math.round(Number(table.posX) || 0),
    posY: Math.round(Number(table.posY) || 0),
    width: Number(table.width) || TABLE_DEFAULT_SIZE,
    height: Number(table.height) || TABLE_DEFAULT_SIZE,
  };
}

/** True when two table rects intersect (with optional gap between them). */
export function tablesOverlap(a, b, gap = TABLE_GRID_GAP) {
  const left = Math.round(Number(a.posX) || 0);
  const top = Math.round(Number(a.posY) || 0);
  const right = left + (Number(a.width) || TABLE_DEFAULT_SIZE) + gap;
  const bottom = top + (Number(a.height) || TABLE_DEFAULT_SIZE) + gap;

  const otherLeft = Math.round(Number(b.posX) || 0);
  const otherTop = Math.round(Number(b.posY) || 0);
  const otherRight = otherLeft + (Number(b.width) || TABLE_DEFAULT_SIZE);
  const otherBottom = otherTop + (Number(b.height) || TABLE_DEFAULT_SIZE);

  return left < otherRight && right > otherLeft && top < otherBottom && bottom > otherTop;
}

export function gridSlot(index, size = TABLE_DEFAULT_SIZE) {
  const col = index % TABLE_GRID_COLUMNS;
  const row = Math.floor(index / TABLE_GRID_COLUMNS);
  return {
    posX: TABLE_ORIGIN_X + col * (size + TABLE_GRID_GAP),
    posY: TABLE_ORIGIN_Y + row * (size + TABLE_GRID_GAP),
  };
}

export function findFreeGridSlot(existingTables = [], size = TABLE_DEFAULT_SIZE) {
  const candidates = existingTables.map(normalizeTable);
  for (let i = 0; i < 256; i += 1) {
    const slot = { ...gridSlot(i, TABLE_DEFAULT_SIZE), width: size, height: size };
    if (!candidates.some((table) => tablesOverlap(slot, table, TABLE_GRID_GAP))) {
      return { posX: slot.posX, posY: slot.posY };
    }
  }
  return gridSlot(candidates.length, TABLE_DEFAULT_SIZE);
}

/**
 * Keeps stored coords when free; if any tables collide (exact or near),
 * spreads the colliding ones onto free grid slots for display.
 */
export function resolveFloorPositions(tables = []) {
  if (!Array.isArray(tables) || tables.length === 0) return tables;

  const sorted = [...tables]
    .map(normalizeTable)
    .sort((a, b) =>
      String(a.code ?? '').localeCompare(String(b.code ?? ''), undefined, { numeric: true }),
    );

  const hasOverlap = sorted.some((table, index) =>
    sorted.slice(0, index).some((other) => tablesOverlap(table, other, TABLE_GRID_GAP)),
  );

  if (!hasOverlap) {
    return tables.map(normalizeTable);
  }

  const placed = [];
  const resolved = new Map();

  for (const table of sorted) {
    const size = Math.max(table.width, table.height, TABLE_DEFAULT_SIZE);
    const candidate = { ...table, width: size, height: size };
    const collides = placed.some((other) => tablesOverlap(candidate, other, TABLE_GRID_GAP));

    if (!collides) {
      placed.push(candidate);
      resolved.set(table.id, candidate);
      continue;
    }

    const slot = findFreeGridSlot(placed, size);
    const moved = { ...table, ...slot, width: size, height: size };
    placed.push(moved);
    resolved.set(table.id, moved);
  }

  return sorted.map((table) => resolved.get(table.id) ?? table);
}

export { TABLE_DEFAULT_SIZE, TABLE_GRID_GAP, TABLE_GRID_COLUMNS, posKey };
