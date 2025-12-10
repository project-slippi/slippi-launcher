# Replay Indexing Worker Pool

Parallel, off-thread parsing of Slippi replay files to prevent UI lockups during replay indexing.

## Architecture

### Components

**ReplayIndexingWorker** (`replay_indexing.worker.ts`)
- Parses individual replay files off the main thread
- Runs `SlippiGame` parsing and `fs.stat` operations
- Returns parsed data: settings, metadata, winner indices

**ReplayIndexingPool** (`replay_indexing_pool.ts`)
- Manages a pool of workers
- Distributes files round-robin across workers for parallel processing
- Pool size: `Math.max(1, Math.min(4, cpuCount - 1))`

**ReplayIndexingPoolManager** (`replay_indexing_pool_manager.ts`)
- Implements lazy initialization and automatic idle timeout
- Creates pool on-demand when first needed
- Terminates workers after 5 minutes of inactivity

## Resource Management

### Why Idle Timeout?

Worker threads sitting idle consume ~10-20 MB each, thread handles, and can prevent CPU deep sleep. Since replay indexing is sporadic, keeping workers alive permanently is wasteful.

### How It Works

```
App starts          → Manager created (no workers yet)
First parse         → Workers spin up on-demand
Parse completes     → 5-minute idle timer starts
New parse arrives   → Timer resets
5 minutes idle      → Workers automatically terminated
Future parse        → Workers seamlessly recreated
```

**Benefits:**
- Zero memory cost when idle
- Better battery life on laptops
- Frees system thread handles
- Still fast when needed (100ms creation overhead amortized over large batches)

### Configuration

Adjust the timeout in `replay_indexing_pool_manager.ts`:

```typescript
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
```

**Shorter timeout (1-2 min)**: Better for memory-constrained systems, infrequent indexing  
**Longer timeout (10-15 min)**: Better for active workflows, reduces re-initialization overhead

## Performance

### Parallelization
- Multiple files parsed simultaneously across CPU cores
- Example: 500 files on 4-core system = ~125 files per worker in parallel

### Overhead
- **Active pool**: Zero overhead compared to always-on pool
- **Cold start**: +50-100ms for pool creation (0.2ms per file for 500 files)
- **Small batches** (≤3 files): Uses single worker to avoid overhead

### UI Responsiveness
- File I/O and CPU-intensive parsing happen off main thread
- Main thread only handles database transactions
- UI remains responsive during indexing

## Usage

```typescript
// Create manager (lightweight, no workers yet)
const manager = createManagedReplayIndexingPool();

// Parse files (workers created on-demand)
const results = await manager.parseReplayFileBatch(folder, filenames);

// Workers auto-terminate after 5 min idle
// No explicit cleanup needed (handled on app quit)
```

## Error Handling

**Worker Creation Fails**
- Pool continues with available workers
- Falls back to main thread if no workers available

**Individual Parse Failures**
- Don't stop batch processing
- Errors logged separately

**Shutdown During Operation**
- Waits for in-flight operations to complete
- Graceful termination

**Concurrent Requests During Shutdown**
- Waits briefly for shutdown to complete
- Recreates pool if needed

## Logging

```
[replay_indexing_pool_manager] Creating worker pool on-demand
[replay_indexing_pool] Worker pool initialized with 4 workers
[database_replay_provider] Worker pool parsed 500 files in 2341ms (213 files/sec across 4 workers)
[replay_indexing_pool_manager] Worker pool idle for 300s, shutting down to save resources
```

**Metrics to monitor:**
- Pool lifetime (creation → termination)
- Recreation frequency
- Memory before/after

If recreating frequently (every 2-3 min), consider increasing timeout.

## Implementation Notes

- Workers are stateless (no shared state between operations)
- Uses `threads.js` library (matches existing `broadcast.worker.ts` pattern)
- SQLite transactions remain on main thread (single-writer optimization)
- Round-robin distribution maintains result order via map reconstruction
- Compatible with Electron main process architecture
