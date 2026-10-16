import { pharmacyIntegrationApi } from '../../../api';
import {
  isAslApiKeyRejectedError,
  isAslIntegrationDisabledError,
} from '../../pharmacy-cashier/utils/resolveMarkingVerifyUserMessage';
import { isPlausibleImportMarkCode } from './isPlausibleImportMarkCode';
import { runLimited } from './runLimited';

/** Параллельность к ASL: много потоков, проверка всё равно полная по каждому КМ. */
export const IMPORT_ASL_VERIFY_CONCURRENCY = 12;

/**
 * Полная проверка всех КМ из импорта через ASL Belgisi.
 * Без отмены: каждый код проверяется до конца. Прогресс — через onProgress.
 */
export async function verifyImportMarksAgainstAsl({
  byLineId,
  storeId,
  concurrency = IMPORT_ASL_VERIFY_CONCURRENCY,
  onProgress,
  verifyMarking = (body) => pharmacyIntegrationApi.verifyMarking(body).then((r) => r.data),
}) {
  const accepted = {};
  const rejected = [];

  if (!storeId || !byLineId || typeof byLineId !== 'object') {
    return { accepted: {}, rejected: [], done: 0, total: 0 };
  }

  const jobs = [];
  for (const [lineId, list] of Object.entries(byLineId)) {
    accepted[lineId] = [];
    const entries = Array.isArray(list) ? list : [];
    for (const entry of entries) {
      const code = String(entry?.code || '').trim();
      if (!isPlausibleImportMarkCode(code)) continue;
      jobs.push({ lineId, code });
    }
  }

  const total = jobs.length;
  let done = 0;

  const report = () => {
    onProgress?.({
      done,
      total,
      acceptedCount: Object.values(accepted).reduce((n, list) => n + list.length, 0),
      rejectedCount: rejected.length,
    });
  };
  report();

  await runLimited(jobs, concurrency, async (job) => {
    try {
      const data = await verifyMarking({ storeId, code: job.code });
      if (data?.alreadySold) {
        rejected.push({ code: job.code, reason: 'alreadySold' });
      } else if (data && data.found === false) {
        rejected.push({ code: job.code, reason: 'notFound' });
      } else {
        accepted[job.lineId].push({
          code: job.code,
          aslStatus: data?.status || 'VERIFIED',
        });
      }
    } catch (error) {
      let reason = 'error';
      if (isAslApiKeyRejectedError(error)) reason = 'badApiKey';
      else if (isAslIntegrationDisabledError(error)) reason = 'noIntegration';
      rejected.push({
        code: job.code,
        reason,
        message: null,
      });
    } finally {
      done += 1;
      report();
    }
  });

  return { accepted, rejected, done, total };
}

export function countImportMarks(byLineId) {
  if (!byLineId || typeof byLineId !== 'object') return 0;
  return Object.values(byLineId).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
}

/** Оценка: ~1.0 с на код с учётом параллельности — только подсказка, проверка всегда полная. */
export function estimateImportVerifySeconds(markCount, concurrency = IMPORT_ASL_VERIFY_CONCURRENCY) {
  const n = Math.max(0, Number(markCount) || 0);
  if (n <= 0) return 0;
  const perCodeSec = 1.0;
  const workers = Math.max(1, concurrency);
  return Math.ceil((n * perCodeSec) / workers);
}
