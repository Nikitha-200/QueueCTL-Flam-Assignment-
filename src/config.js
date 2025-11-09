const { db } = require('./db');
const get = (key, fallback) => {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : fallback;
};
const set = (key, value) => {
  const v = JSON.stringify(value);
  db.prepare('INSERT INTO config(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, v);
};
if (get('retry_base') === undefined) set('retry_base', 2);
if (get('default_max_retries') === undefined) set('default_max_retries', 3);

module.exports = { get, set };
