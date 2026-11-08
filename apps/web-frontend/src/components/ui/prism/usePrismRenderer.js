import { useEffect } from 'react';
import { link, calcPrismOrientation, clamp } from './prismMath';
import { PALETTE_SIZE, HUE_W, HUE_U, HUE_V, INTRO_SECONDS } from './prismShaders';
import { syncPalette } from './prismPaletteUtils';

export function usePrismRenderer(containerRef, canvasRef, settingsRef, wakeRef) {
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!container || !canvas || !gl) return undefined;
    const shader = link(gl);
    if (!shader) return undefined;

    const u = shader.uniforms;
    const vao = gl.createVertexArray();
    const paletteTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, PALETTE_SIZE, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const paletteTracker = { paletteKey: '', neutral: 0 };

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const view = { width: 1, height: 1, scale: 1 };
    const pose = { yaw: 0, pitch: 0, roll: 0 };
    const pointer = { x: 0, y: 0, inside: false };
    let time = 0;
    let introClock = settingsRef.current.intro && !reduce ? 0 : 1;
    let raf = 0;
    let last = 0;
    let visible = true;

    const draw = () => {
      const s = settingsRef.current;
      syncPalette(gl, paletteTexture, s.colors, probe, paletteTracker);
      const half = s.baseWidth * 0.5;
      const ignite = introClock * introClock * (3 - 2 * introClock);
      const c = Math.cos(s.hueShift);
      const sn = Math.sin(s.hueShift);
      gl.bindVertexArray(vao);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(shader.program);
      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniformMatrix3fv(u.uRay, false, calcPrismOrientation(time, s, pose));
      gl.uniform1f(u.uGlow, s.glow * ignite * ignite);
      gl.uniform2f(u.uOffset, s.offsetX * view.scale, -s.offsetY * view.scale);
      gl.uniform1f(u.uColorFreq, s.colorFrequency);
      gl.uniform1f(u.uCenterShift, s.height * 0.25);
      gl.uniform1f(u.uInvBaseHalf, 1 / half);
      gl.uniform1f(u.uInvHeight, 1 / s.height);
      gl.uniform1f(u.uMinAxis, Math.min(half, s.height));
      gl.uniform1f(u.uPxScale, 1 / (canvas.height * 0.1 * s.scale));
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
      gl.uniform1i(u.uPalette, 0);
      gl.uniform1i(u.uUsePalette, s.colors.length ? 1 : 0);
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uNoise, s.noise);
      gl.uniform1f(u.uSaturation, s.saturation);
      gl.uniformMatrix3fv(u.uHue, false, HUE_W.map((w, i) => w + HUE_U[i] * c + HUE_V[i] * sn));
      gl.uniform1i(u.uUseHue, Math.abs(s.hueShift) > 0.0001 ? 1 : 0);
      gl.uniform1f(u.uLight, s.lightMode ? 1 : 0);
      gl.uniform1f(u.uNeutral, paletteTracker.neutral);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const resize = () => {
      const s = settingsRef.current;
      view.width = Math.max(1, container.clientWidth);
      view.height = Math.max(1, container.clientHeight);
      view.scale = Math.min(s.dpr || window.devicePixelRatio || 1, 2) * s.resolution;
      canvas.width = Math.max(1, Math.round(view.width * view.scale));
      canvas.height = Math.max(1, Math.round(view.height * view.scale));
      draw();
      wake();
    };

    const frame = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      if (Math.round(view.width * Math.min(s.dpr || window.devicePixelRatio || 1, 2) * s.resolution) !== canvas.width) {
        resize();
        return;
      }
      const dt = last ? clamp((now - last) / 1000, 0.001, 0.05) : 1 / 60;
      last = now;
      if (!reduce) time += dt;
      if (introClock < 1) introClock = Math.min(1, introClock + dt / INTRO_SECONDS);
      const hover = s.animationType === 'hover';
      const aim = pointer.inside && !reduce && (hover || s.interactive);
      const reach = (hover ? 0.6 : 0.09) * s.hoverStrength;
      const yaw = aim ? -pointer.x * reach : 0;
      const pitch = aim ? pointer.y * reach : 0;
      const follow = 1 - Math.pow(1 - s.inertia, dt * 60);
      pose.yaw += (yaw - pose.yaw) * follow;
      pose.pitch += (pitch - pose.pitch) * follow;
      pose.roll += (0 - pose.roll) * (1 - Math.pow(0.9, dt * 60));
      draw();
      const settling = Math.abs(yaw - pose.yaw) + Math.abs(pitch - pose.pitch) + Math.abs(pose.roll) > 1e-4;
      const spinning = !reduce && !hover && s.animationType !== 'static' && s.timeScale > 0;
      if (spinning || settling || introClock < 1 || (!reduce && s.noise > 0)) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    function wake() {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    }

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
      pointer.inside = Math.abs(x) <= 1 && Math.abs(y) <= 1;
      pointer.x = clamp(x, -1, 1);
      pointer.y = clamp(y, -1, 1);
      if (settingsRef.current.interactive || settingsRef.current.animationType === 'hover') wake();
    };

    const onPointerLeave = () => {
      pointer.inside = false;
      wake();
    };

    const onVisibility = () => {
      last = 0;
      wake();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersection = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) {
        last = 0;
        wake();
      }
    });
    intersection.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('blur', onPointerLeave);
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();
    wakeRef.current = wake;

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('blur', onPointerLeave);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteTexture(paletteTexture);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(shader.program);
    };
  }, [containerRef, canvasRef, settingsRef, wakeRef]);
}
