export function chartMax(values: number[], floor = 1): number {
  return Math.max(...values.map((v) => Number(v) || 0), floor);
}

export function buildYScale(max: number, height: number, padding = 12) {
  const inner = height - padding * 2;
  return (value: number) => padding + inner - (value / max) * inner;
}

export function buildXStep(width: number, count: number, padding = 16): number {
  if (count <= 1) return 0;
  return (width - padding * 2) / (count - 1);
}

export function toPolylinePoints(
  values: number[],
  width: number,
  height: number,
  max: number,
): string {
  if (values.length === 0) return '';
  const yScale = buildYScale(max, height);
  const step = buildXStep(width, values.length);
  const padding = 16;
  return values
    .map((v, i) => {
      const x = padding + step * i;
      const y = yScale(Number(v) || 0);
      return `${x},${y}`;
    })
    .join(' ');
}
