// Test setup file for Vitest
// This configures electron-log to suppress logs during tests
import log from "electron-log";

// Suppress all log output during tests
// You can adjust the level as needed:
// - false: no logs
// - "error": only errors
// - "warn": errors and warnings
log.transports.console.level = false;
log.transports.file.level = false;
log.transports.ipc.level = false;
