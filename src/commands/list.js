const { db } = require('../db');
function run(opts) {
  const where = opts.state ? `WHERE state='${opts.state}'` : '';
  const jobs = db.prepare(`SELECT * FROM jobs ${where} ORDER BY created_at`).all();
  if (jobs.length === 0) console.log('No jobs found.');
  else console.table(jobs.map(j => ({
    id: j.id,
    state: j.state,
    attempts: j.attempts,
    max_retries: j.max_retries,
    run_after: j.run_after,
    locked_by: j.locked_by,
    last_error: j.last_error
  })));
}
module.exports = { run };
