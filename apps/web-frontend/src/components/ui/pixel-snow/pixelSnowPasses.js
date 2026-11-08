import { sizeTarget } from './pixelSnowGl';

export const runPass = (gl, entry, target, width, height) => {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
  gl.viewport(0, 0, width, height);
  gl.useProgram(entry.program);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
};

export const bindTexture = (gl, entry, name, unit, texture) => {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(entry.uniforms[name], unit);
};

export const renderSnowAndPile = (gl, programs, snow, pileTexture, pileRef, quadVao, flakeVao, instanceBuffer, instances, count, sizes, atlasTexture, state, s) => {
  if (!programs?.flake?.program) return;
  gl.bindFramebuffer(gl.FRAMEBUFFER, snow.framebuffer);
  gl.viewport(0, 0, snow.width, snow.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const { pile, pileWidth } = pileRef;
  if (pile.length && pile.some((height) => height > 0.4)) {
    gl.bindTexture(gl.TEXTURE_2D, pileTexture);
    if (pileWidth !== pile.length) {
      pileRef.pileWidth = pile.length;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, pile.length, 1, 0, gl.RED, gl.FLOAT, pile);
    } else {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, pile.length, 1, gl.RED, gl.FLOAT, pile);
    }
    const pileProgram = programs.pile;
    gl.useProgram(pileProgram.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pileTexture);
    gl.uniform1i(pileProgram.uniforms.uPile, 0);
    gl.uniform1f(pileProgram.uniforms.uTime, state.time);
    gl.uniform1f(pileProgram.uniforms.uLight, 1 - s.depth * 0.1);
    gl.bindVertexArray(quadVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  if (count > 0) {
    const flake = programs.flake;
    gl.useProgram(flake.program);
    gl.uniform2f(flake.uniforms.uGrid, snow.width, snow.height);
    gl.uniform4f(flake.uniforms.uSizes, sizes[1], sizes[2], sizes[3], 0);
    gl.uniform1f(flake.uniforms.uLargest, sizes[4]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
    gl.uniform1i(flake.uniforms.uAtlas, 0);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.MAX);
    gl.bindVertexArray(flakeVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, instances.subarray(0, count * 4), gl.DYNAMIC_DRAW);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
    gl.blendEquation(gl.FUNC_ADD);
    gl.disable(gl.BLEND);
  }
};

export const renderBloomPyramid = (gl, programs, down, up, snow, quadVao) => {
  if (!programs?.down?.program || !programs?.up?.program) return;
  gl.bindVertexArray(quadVao);
  let source = snow;
  for (let level = 0; level < down.length; level++) {
    const target = down[level];
    sizeTarget(gl, target, Math.max(1, Math.ceil(source.width / 2)), Math.max(1, Math.ceil(source.height / 2)));
    gl.useProgram(programs.down.program);
    gl.uniform2f(programs.down.uniforms.uTexel, 1 / source.width, 1 / source.height);
    gl.uniform2f(programs.down.uniforms.uTarget, target.width, target.height);
    bindTexture(gl, programs.down, 'uSource', 0, source.texture);
    runPass(gl, programs.down, target, target.width, target.height);
    source = target;
  }
  for (let level = up.length - 1; level >= 0; level--) {
    const from = level === up.length - 1 ? down[down.length - 1] : up[level + 1];
    const target = up[level];
    sizeTarget(gl, target, down[level].width, down[level].height);
    gl.useProgram(programs.up.program);
    gl.uniform2f(programs.up.uniforms.uTexel, 1 / from.width, 1 / from.height);
    gl.uniform2f(programs.up.uniforms.uTarget, target.width, target.height);
    bindTexture(gl, programs.up, 'uSource', 0, from.texture);
    bindTexture(gl, programs.up, 'uBase', 1, down[level].texture);
    runPass(gl, programs.up, target, target.width, target.height);
  }
};

export const renderCompositeOutput = (gl, composite, snow, up, canvas, view, s, toRgb) => {
  if (!composite?.program) return;
  const c = composite.uniforms;
  gl.useProgram(composite.program);
  gl.uniform2f(c.uResolution, canvas.width, canvas.height);
  gl.uniform2f(c.uGrid, snow.width, snow.height);
  gl.uniform1f(c.uPixel, view.pixel * view.ratio);
  gl.uniform3fv(c.uColor, toRgb(s.color));
  gl.uniform1f(c.uBrightness, s.brightness);
  gl.uniform1f(c.uGlow, s.glow);
  gl.uniform1f(c.uFade, s.fade);
  gl.uniform1f(c.uOpacity, s.opacity);
  gl.uniform1f(c.uLightMode, s.lightMode ? 1 : 0);
  bindTexture(gl, composite, 'uSnow', 0, snow.texture);
  bindTexture(gl, composite, 'uGlowMap', 1, up[0].texture);
  runPass(gl, composite, null, canvas.width, canvas.height);
};
