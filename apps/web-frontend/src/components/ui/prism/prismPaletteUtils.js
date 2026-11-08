import { PALETTE_SIZE } from './prismShaders';

export const parseColor = (probe, value) => {
  if (!probe) return [255, 255, 255];
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = '#000000';
  probe.fillStyle = String(value);
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
};

export function syncPalette(gl, paletteTexture, colorsList, probe, tracker) {
  const key = colorsList.join(',');
  if (key === tracker.paletteKey) return;
  tracker.paletteKey = key;
  tracker.neutral = 0;
  if (!colorsList.length) return;

  const stops = colorsList.map((val) => parseColor(probe, val));
  tracker.neutral = 1 - stops.reduce((sum, [r, g, b]) => {
    const top = Math.max(r, g, b);
    return sum + (top > 0 ? (top - Math.min(r, g, b)) / top : 0);
  }, 0) / stops.length;

  const data = new Uint8Array(PALETTE_SIZE * 4);
  for (let i = 0; i < PALETTE_SIZE; i++) {
    const position = (i / PALETTE_SIZE) * stops.length;
    const index = Math.floor(position);
    const a = stops[index % stops.length];
    const b = stops[(index + 1) % stops.length];
    const t = position - index;
    const k = t * t * (3 - 2 * t);
    for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round(a[c] + (b[c] - a[c]) * k);
    data[i * 4 + 3] = 255;
  }

  gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, PALETTE_SIZE, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
}
