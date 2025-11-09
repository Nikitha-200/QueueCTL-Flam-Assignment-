#!/usr/bin/env node
const { Command } = require('commander');
const program = new Command();
const { enqueue } = require('./commands/enqueue');
const workerManager = require('./workerManager');
const dlq = require('./commands/dlq');
const listCmd = require('./commands/list');
const statusCmd = require('./commands/status');
const configCmd = require('./commands/configCmd');
program
  .command('enqueue [json]')
  .description('Add a new job to the queue (or pipe JSON via stdin)')
  .action((json) => {
    const { enqueue } = require('./commands/enqueue');
    if (json) {
      try { enqueue(JSON.parse(json)); }
      catch (err) { console.error('Invalid JSON format:', err.message); }
      return;
    }
    let data = '';
    process.stdin.on('data', c => data += c);
    process.stdin.on('end', () => {
      try { enqueue(JSON.parse(data)); }
      catch (err) { console.error('Invalid JSON from stdin:', err.message); }
    });
  });
const worker = program.command('worker').description('Manage workers');
worker
  .command('start')
  .option('--count <n>', 'Number of workers', '1')
  .action((opts) => workerManager.start(parseInt(opts.count)));
worker.command('stop').action(() => workerManager.stop());
program.command('list')
  .option('--state <s>', 'Filter by state')
  .action((opts) => listCmd.run(opts));
program.command('status').action(() => statusCmd.run());
const dlqCmd = program.command('dlq').description('Dead Letter Queue operations');
dlqCmd.command('list').action(() => dlq.list());
dlqCmd.command('retry <id>').action((id) => dlq.retry(id));
const configCmdGrp = program.command('config').description('Manage configuration');
configCmdGrp.command('set <key> <value>').action((k, v) => configCmd.set(k, v));
program.parse(process.argv);
