import { CELL, SLOTS, VARIANTS, SPRITES } from './pixelSnowSprites';

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const seeded = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  const info = gl.getShaderInfoLog(shader);
  if (info && info.trim()) console.error('[PixelSnow] Shader compile error:', info);
  gl.deleteShader(shader);
  return null;
};

export const link = (gl, vertexSource, fragmentSource, attributes = []) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  attributes.forEach((name, index) => gl.bindAttribLocation(program, index, name));
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('[PixelSnow] Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

export const buildAtlas = () => {
  const width = CELL * SLOTS;
  const height = CELL * VARIANTS.length;
  const data = new Uint8Array(width * height * 4);
  VARIANTS.forEach((variant, row) => {
    SPRITES[variant].forEach((rows, level) => {
      rows.forEach((line, y) => {
        for (let x = 0; x < line.length; x++) {
          const mark = line[x];
          if (mark === '.') continue;
          const offset = ((row * CELL + y) * width + level * CELL + x) * 4;
          data[offset] = 255;
          data[offset + 1] = mark === '@' ? 255 : mark === 'o' ? 128 : 0;
          data[offset + 3] = 255;
        }
      });
    });
  });
  return { data, width, height };
};

export const createTarget = (gl, filter) => {
  const target = { texture: gl.createTexture(), framebuffer: gl.createFramebuffer(), width: 0, height: 0 };
  gl.bindTexture(gl.TEXTURE_2D, target.texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return target;
};

export const sizeTarget = (gl, target, width, height) => {
  if (target.width === width && target.height === height) return;
  target.width = width;
  target.height = height;
  gl.bindTexture(gl.TEXTURE_2D, target.texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
};

export const createColorResolver = () => {
  const probe = typeof document !== 'undefined'
    ? document.createElement('canvas').getContext('2d', { willReadFrequently: true })
    : null;
  const colorCache = new Map();
  return (value) => {
    if (colorCache.has(value)) return colorCache.get(value);
    let rgb = [1, 1, 1];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#ffffff';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      rgb = [r / 255, g / 255, b / 255];
    }
    colorCache.set(value, rgb);
    return rgb;
  };
};
