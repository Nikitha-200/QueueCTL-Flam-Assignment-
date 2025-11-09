const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const workersFile = path.join(__dirname, '..', 'data', 'workers.json');
function saveWorkers(list) {
  fs.writeFileSync(workersFile, JSON.stringify(list, null, 2));
}
function readWorkers() {
  if (fs.existsSync(workersFile)) return JSON.parse(fs.readFileSync(workersFile));
  return [];
}

function start(count) {
  config.set('shutdown', false);
  const list = readWorkers();
  for (let i = 0; i < count; i++) {
    const w = fork(path.join(__dirname, 'workerProcess.js'), [], {
      env: { ...process.env, WORKER_ID: `worker-${Date.now()}-${i}` }
    });
    list.push({ pid: w.pid, started_at: new Date().toISOString() });
    console.log(`Worker started (PID ${w.pid})`);
  }
  saveWorkers(list);
}

function stop() {
  config.set('shutdown', true);
  const list = readWorkers();
  for (const w of list) {
    try { process.kill(w.pid, 'SIGTERM'); } catch { }
  }
  saveWorkers([]);
  console.log('Sent stop signal to all workers.');
}

module.exports = { start, stop, list: readWorkers };
