CREATE TABLE IF NOT EXISTS replays (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    fullPath TEXT NOT,
    name     TEXT NOT NULL,
    folder   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS replays_full_path_idx ON replays(fullPath)
CREATE INDEX IF NOT EXISTS replays_folder_idx ON replays(folder)

CREATE TABLE IF NOT EXISTS replay_data (
    gameId             INTEGER PRIMARY KEY,
    startTime          TEXT,
    lastFrame          INTEGER,
    slpVersion         TEXT,
    isPal              BOOLEAN,
    stageId            INTEGER,
    scene              INTEGER,
    playedOn           TEXT,
    gameComplete       BOOLEAN,
    playableFrameCount INTEGER,
    gameMode           INTEGER
    FOREIGN KEY (gameId) REFERENCES replays(gameId) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS replay_data_start_time_path_idx ON replay_data(startTime)

CREATE TABLE IF NOT EXISTS player (
    gameId           INTEGER,
    playerIndex      INTEGER,
    nametag          TEXT,
    playerCode       TEXT,
    port             INTEGER,
    characterId      INTEGER,
    characterColor   Integer,
    startStocks      Integer,
    endStocks        Integer,
    playerType       Integer,
    teamId           Integer,
    controllerFix    TEXT
    PRIMARY KEY (gameId, playerIndex)
    FOREIGN KEY (gameId) REFERENCES replays(gameId) ON DELETE CASCADE
)

CREATE INDEX IF NOT EXISTS player_nametag_idx ON player(nametag)
CREATE INDEX IF NOT EXISTS player_playerCode_idx ON player(playerCode)

CREATE TABLE IF NOT EXISTS player_stats (
    gameId                       INTEGER,
    playerIndex                  INTEGER,
    wavedashCount                INTEGER,
    wavelandCount                INTEGER,
    airDodgeCount                INTEGER,
    spotDodgeCount               INTEGER,
    dashDanceCount               INTEGER,
    ledgegrabCount               INTEGER,
    rollCount                    INTEGER,
    buttonsCount                 INTEGER,
    triggersCount                INTEGER,
    cstickCount                  INTEGER,
    totalInputCount              INTEGER,
    conversionCount              INTEGER,
    totalDamage                  INTEGER,
    killCount                    INTEGER,
    killCount                    INTEGER,
    inputsPerMinuteCount         INTEGER,
    inputsPerMinuteTotal         INTEGER,
    digitialInputsPerMinuteCount INTEGER,
    digitialInputsPerMinuteTotal INTEGER,
    openingsPerKillCount         INTEGER,
    openingsPerKillTotal         INTEGER,
    damagePerOpeningCount        INTEGER,
    damagePerOpeningTotal        INTEGER,
    neutralWinCount              INTEGER,
    neutralWinTotal              INTEGER,
    counterHitCount              INTEGER,
    counterHitTotal              INTEGER,
    beneficialTradeCount         INTEGER,
    beneficialTradeTotal         INTEGER,
    PRIMARY KEY (gameId, playerIndex)
    FOREIGN KEY (gameId) REFERENCES replays(gameId) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stocks (
    gameId INTEGER,
    playerIndex INTEGER,
    count INTEGER,
    deathAnimation INTEGER
    PRIMARY KEY (gameId, playerIndex, count)
    FOREIGN KEY (gameId) REFERENCES replays(gameId) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS combos (
    gameId INTEGER,
    playerIndex INTEGER,
    index INTEGER,
    didKill BOOLEAN
    PRIMARY KEY (gameId, playerIndex, index)
    FOREIGN KEY (gameId) REFERENCES replays(gameId) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS combo_moves (
    gameId INTEGER,
    playerIndex INTEGER,
    comboIndex INTEGER,
    index INTEGER
    count INTEGER,
    deathAnimation INTEGER
    PRIMARY KEY (gameId, playerIndex, comboIndex, index)
    FOREIGN KEY (gameId) REFERENCES replays(gameId) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversions (
    gameId INTEGER,
    playerIndex INTEGER,
    index INTEGER,
    opening TEXT,
    didKill BOOLEAN
    PRIMARY KEY (gameId, playerIndex, index)
    FOREIGN KEY (gameId) REFERENCES replays(gameId) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversion_moves (
    gameId INTEGER,
    playerIndex INTEGER,
    conversionIndex INTEGER,
    count INTEGER,
    deathAnimation INTEGER
    PRIMARY KEY (gameId, playerIndex, conversionIndex, index)
    FOREIGN KEY (gameId) REFERENCES replays(gameId) ON DELETE CASCADE
);
