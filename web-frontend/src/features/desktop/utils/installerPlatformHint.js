/** macOS .dmg в manifest только под Apple Silicon (arm64), без Intel. */
export function isArm64OnlyMacInstaller(manifest) {
  if (manifest?.macX64?.url || /universal/i.test(manifest?.mac?.fileName || '')) {
    return false;
  }
  const fileName = manifest?.mac?.fileName || manifest?.mac?.url || '';
  return /arm64/i.test(fileName) && !/universal|x64/i.test(fileName);
}

/** Эвристика: Mac без Apple M в WebGL — часто Intel (не 100%). */
export function isLikelyIntelMac() {
  if (typeof navigator === 'undefined' || !/Mac/i.test(navigator.userAgent)) {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return false;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return false;
    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
    if (/Apple M\d/i.test(renderer)) return false;
    if (/Apple GPU/i.test(renderer)) return false;
    return /Intel|AMD|Radeon/i.test(renderer);
  } catch {
    return false;
  }
}

/** Pick Mac installer entry for this browser (arm64 / x64 / universal). */
export function resolveMacInstallerEntry(manifest) {
  if (!manifest) return null;
  if (manifest.macArm64?.url && manifest.macX64?.url) {
    return isLikelyIntelMac() ? manifest.macX64 : manifest.macArm64;
  }
  if (manifest.macArm64?.url && !manifest.macX64?.url) return manifest.macArm64;
  if (manifest.macX64?.url && !manifest.macArm64?.url) return manifest.macX64;
  return manifest.mac || null;
}
