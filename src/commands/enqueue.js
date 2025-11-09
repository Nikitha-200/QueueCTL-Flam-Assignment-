const { db, getNowSec } = require('../db');
const config = require('../config');
function enqueue(jobObj) {
  if (!jobObj.id || !jobObj.command) {
    console.error('job must include id and command');
    process.exit(1);
  }
  const now = getNowSec();
  db.prepare(`INSERT INTO jobs (id,command,state,attempts,max_retries,run_after,created_at,updated_at)
    VALUES(@id,@command,'pending',0,@max_retries,0,@created_at,@updated_at)`).run({
    id: jobObj.id,
    command: jobObj.command,
    max_retries: jobObj.max_retries ?? config.get('default_max_retries', 3),
    created_at: now,
    updated_at: now
  });
  console.log(`Job "${jobObj.id}" enqueued.`);
}
module.exports = { enqueue };
