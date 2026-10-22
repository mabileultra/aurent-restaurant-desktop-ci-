/**
 * Отправка ESC/POS-буфера в принтер Windows (тип задания RAW).
 * Не требует npm-пакета printer — только PowerShell + winspool.
 */

const { execFile, spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const IS_WIN = process.platform === 'win32';

function resolvePs1Path(fileName = 'win-raw-print.ps1') {
  const local = path.join(__dirname, fileName);
  const unpacked = local.replace(`${path.sep}app.asar${path.sep}`, `${path.sep}app.asar.unpacked${path.sep}`);
  // PowerShell -File cannot run scripts from inside app.asar; prefer unpacked copy.
  if (unpacked !== local && fs.existsSync(unpacked)) return unpacked;
  if (!local.includes(`${path.sep}app.asar${path.sep}`) && fs.existsSync(local)) return local;
  return unpacked !== local ? unpacked : local;
}

/**
 * @param {string} printerName — точное имя из Windows
 * @param {Buffer} buffer
 */
function printRawBufferOnce(printerName, buffer) {
  if (!IS_WIN) {
    return Promise.reject(new Error('RAW-печать доступна только в Windows'));
  }
  const name = String(printerName || '').trim();
  if (!name) {
    return Promise.reject(new Error('Принтер не выбран'));
  }
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  if (data.length < 8) {
    return Promise.reject(new Error('Пустой буфер печати'));
  }
  if (!fs.existsSync(resolvePs1Path())) {
    return Promise.reject(new Error('win-raw-print.ps1 не найден в сборке'));
  }

  // Parallel slips in the same ms must not share (and unlink) one temp file.
  const tmpPath = path.join(os.tmpdir(), `aurent-escpos-${crypto.randomUUID()}.bin`);
  fs.writeFileSync(tmpPath, data);

  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        resolvePs1Path(),
        '-PrinterName',
        name,
        '-FilePath',
        tmpPath,
      ],
      { windowsHide: true, timeout: 30000 },
      (err, _stdout, stderr) => {
        fs.unlink(tmpPath, () => {});
        if (err) {
          const detail = (stderr && String(stderr).trim()) || err.message || 'RAW print failed';
          reject(new Error(detail));
          return;
        }
        resolve({ ok: true });
      }
    );
  });
}

/*
 * Long-lived PowerShell per printer: spawn + Add-Type (C# compile) cost 1.5–4 s per slip,
 * so under load the one-shot path above cannot keep up. One worker per printer keeps a stuck
 * printer from blocking the others; one pre-warmed spare makes the first slip fast too.
 */
const WORKER_READY_TIMEOUT_MS = 20_000;
const WORKER_JOB_TIMEOUT_MS = 10_000;
const workers = new Map();
let spareWorker = null;
let workerDisabled = false;
let jobSeq = 0;

class WorkerUnavailableError extends Error {}

function spawnWorker() {
  const script = resolvePs1Path('win-raw-print-worker.ps1');
  if (!fs.existsSync(script)) return null;
  const proc = spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script],
    { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] },
  );
  const worker = { proc, pending: new Map(), buf: '', key: null, dead: false };
  let markReady;
  let failReady;
  worker.ready = new Promise((resolve, reject) => {
    markReady = resolve;
    failReady = reject;
  });
  worker.ready.catch(() => {});
  const readyTimer = setTimeout(() => {
    failReady(new WorkerUnavailableError('RAW worker start timeout'));
    proc.kill();
  }, WORKER_READY_TIMEOUT_MS);

  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', (chunk) => {
    worker.buf += chunk;
    let idx = worker.buf.indexOf('\n');
    while (idx >= 0) {
      const line = worker.buf.slice(0, idx).replace(/\r$/, '');
      worker.buf = worker.buf.slice(idx + 1);
      idx = worker.buf.indexOf('\n');
      if (line === 'READY') {
        clearTimeout(readyTimer);
        markReady();
        continue;
      }
      const [id, status, msg] = line.split('\t');
      const job = worker.pending.get(id);
      if (!job) continue;
      worker.pending.delete(id);
      clearTimeout(job.timer);
      if (status === 'OK') {
        job.resolve({ ok: true });
      } else {
        job.reject(new Error(msg ? Buffer.from(msg, 'base64').toString('utf8') : 'RAW print failed'));
      }
    }
  });

  const onDead = () => {
    if (worker.dead) return;
    worker.dead = true;
    clearTimeout(readyTimer);
    failReady(new WorkerUnavailableError('RAW worker exited'));
    if (worker.key && workers.get(worker.key) === worker) workers.delete(worker.key);
    if (spareWorker === worker) spareWorker = null;
    for (const job of worker.pending.values()) {
      clearTimeout(job.timer);
      job.reject(new Error('RAW worker exited'));
    }
    worker.pending.clear();
  };
  proc.on('error', onDead);
  proc.on('exit', onDead);
  proc.stdin.on('error', () => {});
  return worker;
}

function ensureSpareWorker() {
  if (!IS_WIN || workerDisabled || spareWorker) return;
  spareWorker = spawnWorker();
}

function workerFor(name) {
  const key = name.toLowerCase();
  let worker = workers.get(key);
  if (worker && !worker.dead) return worker;
  worker = spareWorker && !spareWorker.dead ? spareWorker : spawnWorker();
  if (spareWorker === worker) spareWorker = null;
  if (!worker) return null;
  worker.key = key;
  workers.set(key, worker);
  setImmediate(ensureSpareWorker);
  return worker;
}

async function printViaWorker(name, data) {
  const worker = workerFor(name);
  if (!worker) throw new WorkerUnavailableError('RAW worker script missing');
  await worker.ready;
  if (worker.dead) throw new WorkerUnavailableError('RAW worker exited');
  return new Promise((resolve, reject) => {
    const id = String(++jobSeq);
    const timer = setTimeout(() => {
      worker.pending.delete(id);
      reject(new Error('Таймаут RAW-печати'));
      // Hung spooler call: drop this printer's worker, the next slip gets a fresh one.
      worker.proc.kill();
    }, WORKER_JOB_TIMEOUT_MS);
    worker.pending.set(id, { resolve, reject, timer });
    const nameB64 = Buffer.from(name, 'utf8').toString('base64');
    worker.proc.stdin.write(`${id}\t${nameB64}\t${data.toString('base64')}\n`);
  });
}

/**
 * @param {string} printerName — точное имя из Windows
 * @param {Buffer} buffer
 */
async function printRawBuffer(printerName, buffer) {
  const name = String(printerName || '').trim();
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  if (!IS_WIN || workerDisabled || !name || data.length < 8) {
    return printRawBufferOnce(name, data);
  }
  try {
    return await printViaWorker(name, data);
  } catch (err) {
    // Nothing reached the spooler yet — safe to use the one-shot path.
    if (err instanceof WorkerUnavailableError) {
      if (/start timeout|script missing/.test(err.message)) workerDisabled = true;
      return printRawBufferOnce(name, data);
    }
    throw err;
  }
}

module.exports = {
  IS_WIN,
  printRawBuffer,
  warmRawPrintWorker: ensureSpareWorker,
};
