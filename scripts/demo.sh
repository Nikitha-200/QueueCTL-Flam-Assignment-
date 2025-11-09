#!/usr/bin/env bash
set -e
echo "🧪 Demo started"
queuectl enqueue '{"id":"job-success-1","command":"echo Hello QueueCTL"}'
queuectl enqueue '{"id":"job-fail-1","command":"bash -c \"exit 2\"","max_retries":2}'
queuectl enqueue '{"id":"job-bad-cmd","command":"nonexistentcmd","max_retries":2}'
queuectl worker start --count 2
echo " Waiting 20 seconds for processing and retries..."
sleep 20
queuectl status
queuectl dlq list
queuectl worker stop

echo "Demo completed"
