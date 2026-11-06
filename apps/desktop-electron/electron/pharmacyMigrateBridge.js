/**
 * Legacy grocery-desktop → pharmacy-desktop cutover.
 * Downloads NSIS installer, silent-installs when possible, launches new app, quits old.
 */
const { app, ipcMain, BrowserWindow, shell, net } = require('electron');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

let migrateBusy = false;

function broadcast(payload) {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('desktop:pharmacy-migrate', payload);
    }
  });
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ''));
}

function resolveCandidateExes() {
  const local = process.env.LOCALAPPDATA || '';
  const pf = process.env.ProgramFiles || 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  return [
    path.join(local, 'Programs', 'Aurent Pharmacy', 'Aurent Pharmacy.exe'),
    path.join(pf, 'Aurent Pharmacy', 'Aurent Pharmacy.exe'),
    path.join(pf86, 'Aurent Pharmacy', 'Aurent Pharmacy.exe'),
  ];
}

async function waitForPharmacyExe(timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    for (const exe of resolveCandidateExes()) {
      try {
        await fsp.access(exe, fs.constants.F_OK);
        return exe;
      } catch {
        /* keep polling */
      }
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

function downloadToFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    let settled = false;
    const fail = (err) => {
      if (settled) return;
      settled = true;
      reject(err instanceof Error ? err : new Error(String(err)));
    };
    request.on('response', (response) => {
      const status = Number(response.statusCode || 0);
      if (status < 200 || status >= 300) {
        fail(new Error(`download HTTP ${status}`));
        response.resume();
        return;
      }
      const total = Number(response.headers['content-length'] || 0);
      let received = 0;
      const hash = crypto.createHash('sha256');
      const out = fs.createWriteStream(destPath);
      response.on('data', (chunk) => {
        received += chunk.length;
        hash.update(chunk);
        out.write(chunk);
        if (typeof onProgress === 'function') {
          const percent = total > 0 ? Math.min(99, Math.round((received / total) * 100)) : null;
          onProgress({ received, total, percent });
        }
      });
      response.on('end', () => {
        out.end(() => {
          if (settled) return;
          settled = true;
          resolve({ sha256: hash.digest('hex'), bytes: received });
        });
      });
      response.on('error', fail);
      out.on('error', fail);
    });
    request.on('error', fail);
    request.end();
  });
}

function runInstaller(installerPath) {
  return new Promise((resolve) => {
    // electron-builder NSIS: /S = silent. Falls back to interactive if UAC blocks.
    const child = spawn(installerPath, ['/S'], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.on('error', () => resolve({ ok: false, mode: 'spawn-error' }));
    child.unref();
    // NSIS /S often returns quickly while install continues — poll exe path instead.
    resolve({ ok: true, mode: 'silent' });
  });
}

async function launchPharmacyAndQuit(exePath) {
  try {
    if (exePath) {
      spawn(exePath, [], { detached: true, stdio: 'ignore' }).unref();
    } else {
      // Last resort: open Start Menu shortcut name via shell
      await shell.openPath(resolveCandidateExes()[0]).catch(() => {});
    }
  } catch {
    /* ignore */
  }
  setTimeout(() => {
    try {
      app.exit(0);
    } catch {
      /* ignore */
    }
  }, 800);
}

async function migrateToPharmacyDesktop(payload = {}) {
  if (process.platform !== 'win32') {
    return { ok: false, reason: 'windows-only' };
  }
  if (migrateBusy) {
    return { ok: false, reason: 'busy' };
  }
  const url = String(payload.url || '').trim();
  const expectedSha = String(payload.sha256 || '').trim().toLowerCase();
  const fileName = String(payload.fileName || 'Aurent-Pharmacy-setup.exe').replace(/[^\w.\-]+/g, '_');
  if (!isHttpUrl(url)) {
    return { ok: false, reason: 'bad-url' };
  }

  migrateBusy = true;
  broadcast({ type: 'started' });

  const destDir = path.join(app.getPath('temp'), 'aurent-pharmacy-migrate');
  const destPath = path.join(destDir, fileName);

  try {
    await fsp.mkdir(destDir, { recursive: true });
    broadcast({ type: 'downloading', percent: 0 });
    const { sha256 } = await downloadToFile(url, destPath, ({ percent }) => {
      if (percent != null) broadcast({ type: 'downloading', percent });
    });
    if (expectedSha && sha256 !== expectedSha) {
      broadcast({ type: 'error', code: 'checksum' });
      return { ok: false, reason: 'checksum' };
    }
    broadcast({ type: 'downloaded' });
    broadcast({ type: 'installing' });

    const install = await runInstaller(destPath);
    if (!install.ok) {
      // Interactive fallback — user completes wizard; we still try to detect + quit.
      await shell.openPath(destPath);
    }

    const exePath = await waitForPharmacyExe(install.ok ? 180_000 : 300_000);
    if (!exePath) {
      broadcast({ type: 'error', code: 'install-timeout' });
      // Leave installer UI / file for manual finish; do not force-quit blindly.
      return { ok: false, reason: 'install-timeout', installerPath: destPath };
    }

    broadcast({ type: 'launching', exePath });
    await launchPharmacyAndQuit(exePath);
    return { ok: true };
  } catch (error) {
    const message = error?.message || String(error);
    broadcast({ type: 'error', code: 'network', message });
    return { ok: false, reason: 'network', message };
  } finally {
    migrateBusy = false;
  }
}

function registerPharmacyMigrateIpc() {
  ipcMain.handle('desktop:migrateToPharmacyDesktop', (_event, payload) =>
    migrateToPharmacyDesktop(payload || {})
  );
}

module.exports = {
  registerPharmacyMigrateIpc,
};
