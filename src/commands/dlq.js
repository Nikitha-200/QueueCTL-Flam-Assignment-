const { db, getNowSec } = require('../db');

function list() {
  const jobs = db.prepare("SELECT * FROM jobs WHERE state='dead'").all();
  if (jobs.length === 0) console.log('DLQ is empty.');
  else
    console.table(
      jobs.map(j => ({
        id: j.id,
        attempts: j.attempts,
        last_error: j.last_error
      }))
    );
}

function retry(id) {
  const now = getNowSec();
  const job = db.prepare("SELECT * FROM jobs WHERE id=? AND state='dead'").get(id);
  if (!job) return console.log('Job not found in DLQ.');

  db.prepare(
    "UPDATE jobs SET state='pending', attempts=0, run_after=0, last_error=NULL, updated_at=? WHERE id=?"
  ).run(now, id);

  console.log(`Retried job "${id}" from DLQ.`);
}

module.exports = { list, retry };
