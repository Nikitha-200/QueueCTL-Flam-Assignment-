QueueCTL — CLI-Based Background Job Queue System
> A minimal, production-grade **background job queue** built with **Node.js** and **SQLite**.
> QueueCTL lets you enqueue shell commands as jobs, process them with **parallel worker processes**, handle **automatic retries** using **exponential backoff**, and manage permanently failed jobs via a **Dead Letter Queue (DLQ)** — all through a single, simple CLI tool.
## Project Overview
QueueCTL is a developer-friendly background job processing system that can run commands like `echo`, `sleep`, or any shell process asynchronously in the background.
It features durable job storage, retry-on-failure, parallel workers, configuration control, and automatic persistence — ideal for learning backend concurrency and queueing systems.

##  Tech Stack
* **Language:** Node.js (v18+)
* **Database:** SQLite (via `better-sqlite3`)
* **CLI Framework:** Commander.js
* **Process Management:** Node’s `child_process` (fork & exec)
* **Persistence:** Local SQLite database file
* **Supported OS:** Windows, Linux, macOS

##  Demo Video
 **Demo Link:** [https://drive.google.com/file/d/1vXCO9qCd_zHZyevEmlRwjuqlrB82DdP6/view?usp=sharing](https://drive.google.com/file/d/1vXCO9qCd_zHZyevEmlRwjuqlrB82DdP6/view?usp=sharing)

 
##  Setup Instructions

### 1. Clone the Repository
git clone https://github.com/Nikitha-200/QueueCTL-Flam-Assignment-.git
cd QueueCTL-Flam-Assignment-

### 2. Install Dependencies
npm install

### 3. Link CLI Globally (optional but recommended)
npm link

Now you can run the tool globally using:
queuectl --help
Or run locally using:
node src/cli.js --help

##  Directory Structure
queuectl/
├── src/
│   ├── cli.js               
│   ├── db.js                 
│   ├── workerManager.js      
│   ├── workerProcess.js      
│   └── commands/             
│       ├── enqueue.js
│       ├── list.js
│       ├── status.js
│       ├── configCmd.js
│       └── dlq.js
├── data/                     
├── scripts/                  
│   ├── demo.sh
└── package.json

##  Usage Examples

 Enqueue a Job
$json = '{"id":"demo2","command":"echo hello"}'
echo $json | queuectl enqueue

Or via stdin:

echo '{"id":"job2","command":"sleep 2"}' | queuectl enqueue

 Start Workers
queuectl worker start --count 2

Runs 2 workers that process jobs concurrently.

Stop Workers
queuectl worker stop
Gracefully stops all workers after finishing current jobs.


### View Queue Status

queuectl status

Example output:
 Job Status Summary:
┌─────────┬─────────────┬───┐
│ (index) │ state       │ c │
├─────────┼─────────────┼───┤
│ 0       │ completed   │ 2 │
│ 1       │ dead        │ 1 │
└─────────┴─────────────┴───┘
Total Jobs: 3

### List Jobs by State

queuectl list --state completed


### Dead Letter Queue (DLQ)

List permanently failed jobs:

queuectl dlq list

Retry a DLQ job:

queuectl dlq retry job-fail-1


###  Configuration

Change retry and backoff configuration:

queuectl config set retry_base 2
queuectl config set default_max_retries 3


##  Architecture Overview

Components

| Component                   | Description                                              |
| --------------------------- | -------------------------------------------------------- |
| **Jobs Table (SQLite)**     | Stores all jobs, retries, timestamps, and states         |
| **Worker Processes**        | Execute commands concurrently with locking               |
| **Dead Letter Queue (DLQ)** | Holds permanently failed jobs                            |
| **Config Table**            | Dynamic system configuration (retry_base, shutdown flag) |
| **CLI (Commander.js)**      | Provides developer-friendly interface                    |


 Job Lifecycle

| State        | Description                              |
| ------------ | ---------------------------------------- |
| `pending`    | Waiting to be picked up by a worker      |
| `processing` | Being executed                           |
| `completed`  | Executed successfully                    |
| `failed`     | Retry scheduled with exponential backoff |
| `dead`       | Moved to DLQ after all retries exhausted |

 Retry Logic

Exponential Backoff:
delay = base ^ attempts  (in seconds)
Example:

* base = 2 → 1st retry = 2s, 2nd retry = 4s, 3rd retry = 8s
  After exceeding `max_retries`, job moves to `dead` state.

###  Persistence

All jobs and configurations are stored in:

data/queue.db
data/workers.json

Survives restarts (persistent queue).

 Worker Management

* Spawns multiple workers using `fork()`
* Each worker atomically claims a single job
* Prevents duplicate processing via DB-level locks
* Handles `SIGTERM` and `SIGINT` for graceful shutdowns
 Assumptions & Trade-offs

1. **SQLite** is ideal for single-node durability and simplicity.
2. **Shell command execution** assumes trusted input.
3. **Retry** is time-based, no job priority system.
4. **Graceful shutdown** ensures job completion before exit.
5. **No output logging** (optional extension).

## Testing Instructions

###  Automated Demo (Recommended)

**Windows (PowerShell):**
.\scripts\demo.ps1

The demo will:

1. Enqueue three jobs (success, fail, missing command)
2. Start two workers
3. Wait for retries
4. Show status + DLQ
5. Stop workers gracefully

### 🧩 Manual Testing

| Test             | Command                                                             | Expected Result                     |
| ---------------- | ------------------------------------------------------------------- | ----------------------------------- |
| Successful job   | `queuectl enqueue '{"id":"j1","command":"echo hi"}'`                | Job completes                       |
| Failed job       | `queuectl enqueue '{"id":"j2","command":"exit 1","max_retries":2}'` | Retries twice, moves to DLQ         |
| Multiple workers | `queuectl worker start --count 3`                                   | Each worker processes different job |
| Persistence      | Restart and run `queuectl list`                                     | Jobs still exist                    |
| DLQ retry        | `queuectl dlq retry <id>`                                           | Job requeued as pending             |

##  Deliverables Checklist

* ✅ Working CLI application (`queuectl`)
* ✅ Persistent job storage (SQLite)
* ✅ Multiple worker support
* ✅ Retry mechanism (exponential backoff)
* ✅ Dead Letter Queue (DLQ)
* ✅ Config management
* ✅ Graceful shutdown
* ✅ Clean CLI interface & help texts
* ✅ Comprehensive README (this file)
* ✅ Demo script (`scripts/demo.ps1`, `scripts/demo.sh`)
