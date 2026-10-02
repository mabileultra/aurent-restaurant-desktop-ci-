const { randomUUID } = require('node:crypto');
const { PRINT_JOB_STATUS, assertPrintJobTransition } = require('../domain/printJobStatus.cjs');
const { buildPrintJobPayload } = require('../domain/printJobPayload.cjs');

function createPrintJobRepo(db, { idFactory = randomUUID, clock = () => new Date().toISOString() } = {}) {
  return {
    /**
     * Insert PENDING job with immutable payload snapshot.
     * @param {object} input — same shape as buildPrintJobPayload + optional orderId
     */
    insertPending(input) {
      const payload = buildPrintJobPayload({
        ...input,
        createdAt: input.createdAt || clock(),
      });
      const id = idFactory();
      db.prepare(
        `INSERT INTO print_jobs(id, order_id, kind, printer_name, status, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        payload.orderId,
        payload.kind,
        payload.printerName,
        PRINT_JOB_STATUS.PENDING,
        JSON.stringify(payload),
        payload.createdAt,
      );
      return { id, status: PRINT_JOB_STATUS.PENDING, payload };
    },

    /** Soft-fail at commit: order/outbox stay; print never goes PENDING. */
    insertFailed(input, error) {
      const payload = buildPrintJobPayload({
        ...input,
        createdAt: input.createdAt || clock(),
      });
      const id = idFactory();
      const err = error != null ? String(error) : 'print_failed';
      db.prepare(
        `INSERT INTO print_jobs(id, order_id, kind, printer_name, status, payload_json, last_error, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        payload.orderId,
        payload.kind,
        payload.printerName || '',
        PRINT_JOB_STATUS.FAILED,
        JSON.stringify(payload),
        err,
        payload.createdAt,
      );
      return { id, status: PRINT_JOB_STATUS.FAILED, payload, lastError: err };
    },

    getById(id) {
      return db.prepare(`SELECT * FROM print_jobs WHERE id = ?`).get(id) || null;
    },

    transition(id, toStatus, { error = null } = {}) {
      const row = this.getById(id);
      if (!row) throw new Error(`print_job_not_found:${id}`);
      assertPrintJobTransition(row.status, toStatus);
      const at = clock();
      if (toStatus === PRINT_JOB_STATUS.PRINTING) {
        db.prepare(
          `UPDATE print_jobs SET status = ?, started_at = ?, attempt_count = attempt_count + 1 WHERE id = ?`,
        ).run(toStatus, at, id);
      } else if (toStatus === PRINT_JOB_STATUS.PRINTED) {
        db.prepare(
          `UPDATE print_jobs SET status = ?, printed_at = ?, last_error = NULL WHERE id = ?`,
        ).run(toStatus, at, id);
      } else if (toStatus === PRINT_JOB_STATUS.FAILED || toStatus === PRINT_JOB_STATUS.UNKNOWN) {
        db.prepare(
          `UPDATE print_jobs SET status = ?, last_error = ? WHERE id = ?`,
        ).run(toStatus, error != null ? String(error) : row.last_error, id);
      } else {
        db.prepare(`UPDATE print_jobs SET status = ? WHERE id = ?`).run(toStatus, id);
      }
      return { id, status: toStatus };
    },

    listPending(limit = 50) {
      return db.prepare(
        `SELECT * FROM print_jobs WHERE status = ? ORDER BY created_at ASC LIMIT ?`,
      ).all(PRINT_JOB_STATUS.PENDING, limit);
    },

    listByStatus(status, limit = 50) {
      return db.prepare(
        `SELECT * FROM print_jobs WHERE status = ? ORDER BY created_at DESC LIMIT ?`,
      ).all(status, limit);
    },
  };
}

module.exports = { createPrintJobRepo };
