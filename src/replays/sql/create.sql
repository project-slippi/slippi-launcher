CREATE TABLE IF NOT EXISTS replays (
    fullPath      TEXT PRIMARY KEY,
    name          TEXT,
    folder        TEXT
);

CREATE INDEX IF NOT EXISTS folder_idx ON replays(folder);

CREATE TABLE IF NOT EXISTS replay_data (
    fullPath      TEXT PRIMARY KEY,
    startTime     TEXT,
    lastFrame     INTEGER,
    settings      JSON,
    metadata      JSON,
    FOREIGN KEY (fullPath) REFERENCES replays(fullPath) ON DELETE CASCADE
);