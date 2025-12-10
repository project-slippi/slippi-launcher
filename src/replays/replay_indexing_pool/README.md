# Worker Pool Implementation for Replay Indexing

## Overview

This document describes the worker pool implementation for parsing Slippi replay files off the main thread to prevent UI lockups during replay indexing.

## Architecture

### Components

1. **ReplayIndexingWorker** (`replay_indexing.worker.ts`)
   - Individual worker that parses replay files
   - Runs `SlippiGame` parsing and `fs.stat` operations
   - Returns parsed data including settings, metadata, and winner indices

2. **ReplayIndexingPool** (`replay_indexing_pool.ts`)
   - Manages a pool of replay indexing workers
   - Distributes files across workers for parallel processing
   - Handles worker lifecycle and cleanup

3. **DatabaseReplayProvider** (updated)
   - Uses the worker pool for file parsing
   - Falls back to main thread parsing if pool unavailable
   - Separates parsing (worker pool) from database operations (main thread)

### Worker Pool Design

#### Pool Size
- Automatically determined based on CPU cores: `Math.max(1, Math.min(4, cpuCount - 1))`
- Minimum: 1 worker
- Maximum: 4 workers (to avoid excessive resource usage)
- Leaves one core for main thread and database operations

#### Distribution Strategy
- Files are distributed round-robin across workers
- For small batches (≤3 files), uses a single worker to avoid overhead
- Maintains result order by reconstructing from a map

#### Lifecycle Management
- Pool initialized on app startup
- All workers terminated on app quit
- Waits for in-flight operations to complete before termination
- Graceful error handling with fallback to main thread

## Performance Benefits

### Parallelization
- Multiple files parsed simultaneously across CPU cores
- Batch processing with `parseReplayFileBatch()` distributes work optimally
- Example: 500 files on 4-core system = ~125 files per worker in parallel

### Non-blocking UI
- File I/O and CPU-intensive parsing happen off main thread
- Main thread only handles database transactions
- User interface remains responsive during replay indexing

### Optimal Resource Usage
- Workers limited to prevent CPU saturation
- Main thread reserved for database and UI
- SQLite single-writer constraint handled correctly

## Usage Example

```typescript
// Create and initialize pool
const pool = createReplayIndexingPool();
await pool.initialize();

// Parse files in parallel
const results = await pool.parseReplayFileBatch(folder, filenames);

// Cleanup when done
await pool.terminate();
```

## Error Handling

1. **Worker Creation Failures**: If any workers fail to create, pool continues with available workers
2. **Parse Failures**: Individual file failures don't stop batch processing; errors logged separately
3. **Pool Unavailable**: Automatic fallback to synchronous main-thread parsing
4. **Graceful Shutdown**: In-flight operations complete before worker termination

## Logging

The implementation includes detailed logging:
- Pool initialization and size
- Worker creation status
- Parse performance metrics (files/sec per batch)
- Individual failures and warnings
- Cleanup and termination status

Example log output:
```
[replay_indexing_pool] Creating replay indexing pool (CPU cores: 8, pool size: 4)
[replay_indexing_pool] Worker pool initialized with 4 workers
[database_replay_provider] Worker pool parsed 500 files in 2341ms (213 files/sec across 4 workers)
```

## Future Enhancements

Potential improvements for the worker pool:

1. **Dynamic Pool Sizing**: Adjust worker count based on system load
2. **Priority Queue**: Allow high-priority files to jump the queue
3. **Caching**: Cache frequently accessed replay metadata
4. **Warm Workers**: Keep workers alive between indexing operations
5. **Progress Reporting**: Per-worker progress updates for better UX
6. **Adaptive Batching**: Adjust batch sizes based on file sizes and worker performance

## Implementation Notes

- Workers are stateless - no shared state between parse operations
- Thread pool uses the `threads.js` library
- Follows existing worker patterns from `broadcast.worker.ts`
- Compatible with Electron's main process architecture
- SQLite transactions remain on main thread (single-writer optimization)

