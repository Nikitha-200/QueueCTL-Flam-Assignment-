const { db } = require('../db');
const fs = require('fs');
const path = require('path');
const workersFile = path.join(__dirname, '..', '..', 'data', 'workers.json');
function run() {
  const total = db.prepare('SELECT COUNT(*) as c FROM jobs').get().c;
  const byState = db.prepare('SELECT state, COUNT(*) as c FROM jobs GROUP BY state').all();
  console.log('\nJob Status Summary:');
  console.table(byState);
  console.log('Total Jobs:', total);

  if (fs.existsSync(workersFile)) {
    const workers = JSON.parse(fs.readFileSync(workersFile));
    console.log('\n Active Workers:');
    console.table(workers);
  } else {
    console.log('\n No active workers found.');
  }
}

module.exports = { run };
