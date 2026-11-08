import { QUAD_VERTEX, FLAKE_VERTEX, FLAKE_FRAGMENT, PILE, DOWN, UP, COMPOSITE } from './pixelSnowShaders';
import { link, buildAtlas, createTarget } from './pixelSnowGl';

export function initPixelSnowGl(gl) {
  const programs = {
    flake: link(gl, FLAKE_VERTEX, FLAKE_FRAGMENT, ['aCorner', 'aFlake']),
    pile: link(gl, QUAD_VERTEX, PILE, ['aPosition']),
    down: link(gl, QUAD_VERTEX, DOWN, ['aPosition']),
    up: link(gl, QUAD_VERTEX, UP, ['aPosition']),
    composite: link(gl, QUAD_VERTEX, COMPOSITE, ['aPosition']),
  };

  if (Object.values(programs).some((entry) => !entry)) {
    console.warn('[PixelSnow] Some programs failed to compile/link');
    return null;
  }

  const atlas = buildAtlas();
  const atlasTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, atlas.width, atlas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, atlas.data);

  const quadBuffer = gl.createBuffer();
  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const cornerBuffer = gl.createBuffer();
  const instanceBuffer = gl.createBuffer();
  const flakeVao = gl.createVertexArray();
  gl.bindVertexArray(flakeVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(1, 1);

  const snow = createTarget(gl, gl.NEAREST);
  const pileTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, pileTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const down = [createTarget(gl, gl.LINEAR), createTarget(gl, gl.LINEAR), createTarget(gl, gl.LINEAR)];
  const up = [createTarget(gl, gl.LINEAR), createTarget(gl, gl.LINEAR)];

  return {
    programs,
    atlasTexture,
    quadBuffer,
    quadVao,
    cornerBuffer,
    instanceBuffer,
    flakeVao,
    snow,
    pileTexture,
    down,
    up,
  };
}

export function destroyPixelSnowGl(gl, res) {
  if (!gl || !res) return;
  for (const target of [res.snow, ...res.down, ...res.up]) {
    if (target?.texture) gl.deleteTexture(target.texture);
    if (target?.framebuffer) gl.deleteFramebuffer(target.framebuffer);
  }
  for (const entry of Object.values(res.programs || {})) {
    if (entry?.program) gl.deleteProgram(entry.program);
  }
  if (res.atlasTexture) gl.deleteTexture(res.atlasTexture);
  if (res.pileTexture) gl.deleteTexture(res.pileTexture);
  if (res.quadBuffer) gl.deleteBuffer(res.quadBuffer);
  if (res.cornerBuffer) gl.deleteBuffer(res.cornerBuffer);
  if (res.instanceBuffer) gl.deleteBuffer(res.instanceBuffer);
  if (res.quadVao) gl.deleteVertexArray(res.quadVao);
  if (res.flakeVao) gl.deleteVertexArray(res.flakeVao);
  gl.getExtension('WEBGL_lose_context')?.loseContext();
}
