const { db, getNowSec } = require('./db');
const config = require('./config');
const { exec } = require('child_process');
const WORKER_ID = process.env.WORKER_ID || `w-${process.pid}`;
let shuttingDown = false;
process.on('SIGTERM', () => {
  shuttingDown = true;
  console.log(`Worker ${WORKER_ID} shutting down...`);
});
process.on('SIGINT', () => {
  shuttingDown = true;
  console.log(`Worker ${WORKER_ID} shutting down...`);
});

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

// Atomically claim the next available job across processes
const claimJob = () => {
  const now = getNowSec();
  try {
    const claimed = db
      .prepare(`
        UPDATE jobs
        SET state='processing', locked_by=?, updated_at=?
        WHERE id = (
          SELECT id FROM jobs
          WHERE state IN ('pending','failed') AND run_after <= ?
          ORDER BY created_at
          LIMIT 1
        )
        RETURNING *
      `)
      .get(WORKER_ID, now, now);
    if (claimed) return claimed;
  } catch (e) {
    // fallback below
  }
  // Fallback path without RETURNING: SELECT then conditional UPDATE
  const candidate = db
    .prepare(`SELECT id FROM jobs WHERE state IN ('pending','failed') AND run_after <= ? ORDER BY created_at LIMIT 1`)
    .get(now);
  if (!candidate) return null;
  const res = db
    .prepare(`UPDATE jobs SET state='processing', locked_by=?, updated_at=? WHERE id=? AND state IN ('pending','failed')`)
    .run(WORKER_ID, now, candidate.id);
  if (res.changes === 0) return null; // someone else claimed
  return db.prepare('SELECT * FROM jobs WHERE id=?').get(candidate.id);
};

async function processJob(job) {
  return new Promise((resolve) => {
    exec(job.command, { timeout: 0 }, (error) => {
      const now = getNowSec();
      if (!error) {
        db.prepare(`UPDATE jobs SET state='completed', updated_at=?, locked_by=NULL WHERE id=?`).run(now, job.id);
        console.log(`✅ ${WORKER_ID}: completed ${job.id}`);
      } else {
        const attempts = (job.attempts || 0) + 1;
        const maxRetries = job.max_retries;
        const base = parseInt(config.get('retry_base', 2));
        if (attempts > maxRetries) {
          db.prepare(`UPDATE jobs SET state='dead', attempts=?, last_error=?, updated_at=?, locked_by=NULL WHERE id=?`)
            .run(attempts, error.message, now, job.id);
          console.log(`💀 ${WORKER_ID}: job ${job.id} moved to DLQ.`);
        } else {
          const delay = Math.pow(base, attempts);
          const run_after = now + delay;
          db.prepare(`UPDATE jobs SET state='failed', attempts=?, run_after=?, last_error=?, updated_at=?, locked_by=NULL WHERE id=?`)
            .run(attempts, run_after, error.message, now, job.id);
          console.log(`🔁 ${WORKER_ID}: retry ${job.id} in ${delay}s`);
        }
      }
      resolve();
    });
  });
}

(async function main() {
  console.log(`👷 Worker started: ${WORKER_ID}`);
  while (!shuttingDown) {
    // Global shutdown flag allows graceful stop across platforms
    const globalShutdown = !!config.get('shutdown', false);
    if (globalShutdown) {
      shuttingDown = true;
      break;
    }
    const job = claimJob();
    if (job) await processJob(job);
    else await sleep(1000);
  }
  console.log(`👋 Worker ${WORKER_ID} exited gracefully.`);
})();
