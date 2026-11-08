import { VERTEX_SHADER, FRAGMENT_SHADER } from './lightTunnelShaders';

export const compileShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

export const linkProgram = (gl, vertexSource = VERTEX_SHADER, fragmentSource = FRAGMENT_SHADER) => {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
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

export const createColorParser = () => {
  let probe = null;
  if (typeof document !== 'undefined') {
    probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  }
  const cache = new Map();

  return (value, fallback = [1, 1, 1]) => {
    if (!value) return fallback;
    const key = String(value);
    if (cache.has(key)) return cache.get(key);

    let rgb = fallback;
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#000000';
      probe.fillStyle = key;
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      rgb = [r / 255, g / 255, b / 255];
    }
    cache.set(key, rgb);
    return rgb;
  };
};

export const applyLightTunnelUniforms = (gl, u, s, state) => {
  const { width, height, ratio, minSide, flow, surgeDepth, surgeLevel, eased, time, drift, steer, parse } = state;
  gl.uniform2f(u.uResolution, width, height);
  gl.uniform2f(u.uCenter, s.centerX * minSide, s.centerY * minSide);
  gl.uniform1f(u.uScale, minSide * 0.5 * s.size);
  gl.uniform1f(u.uRatio, ratio);
  gl.uniform1f(u.uTime, time);
  gl.uniform1f(u.uDrift, drift);
  gl.uniform2f(u.uSteer, steer.x, steer.y);
  gl.uniform1f(u.uBend, s.bend * 0.45);
  gl.uniform1f(u.uCount, s.cableCount);
  gl.uniform1f(u.uSwing, (Math.sin(drift * 0.9) * s.sway * 0.5) / (Math.PI * 2));
  gl.uniform1f(u.uWave, s.waviness * 0.15);
  gl.uniform1f(u.uWidth, (0.25 + s.thickness * 1.5) * ratio);
  gl.uniform1f(u.uPulseWidth, 0.6 + s.pulseWidth * 0.9);

  const length = s.pulseLength * 1.2;
  gl.uniform1f(u.uHead, length * (0.08 + s.pulseBlend * 0.22));
  gl.uniform1f(u.uTail, length * (0.5 + s.pulseBlend * 0.7));
  gl.uniform1f(u.uChance, s.pulseDensity);
  gl.uniform1f(u.uSpacing, 0.4);
  gl.uniform1f(u.uPulseSpeed, s.pulseSpeed * 4);
  gl.uniform1f(u.uFlow, flow);
  gl.uniform1f(u.uHalo, 1.2 + s.rimWidth * 8);
  gl.uniform1f(u.uGlow, s.glow);
  gl.uniform1f(u.uBrightness, s.brightness);
  gl.uniform1f(u.uVariance, s.colorVariance ? 1 : 0);
  gl.uniform1f(u.uBody, s.tunnelOpacity);
  gl.uniform1f(u.uFadeNear, s.fadeNear);
  gl.uniform1f(u.uFadeFar, s.fadeFar);
  gl.uniform3fv(u.uCable, parse(s.cableColor, [1, 1, 1]));
  gl.uniform3fv(u.uPulse, parse(s.pulseColor, [1, 1, 1]));
  gl.uniform3fv(u.uTunnel, parse(s.tunnelColor, [1, 1, 1]));
  gl.uniform3f(u.uSurge, surgeDepth, surgeLevel, 0.22);
  gl.uniform1f(u.uReveal, 1.7 - eased * 3.6);
  gl.uniform1f(u.uGrain, s.grain ? s.grainIntensity : 0);
  gl.uniform1f(u.uSeed, s.variation);
  gl.uniform1f(u.uLight, s.lightMode ? 1 : 0);
  gl.uniform1f(u.uOpacity, s.opacity);
};
