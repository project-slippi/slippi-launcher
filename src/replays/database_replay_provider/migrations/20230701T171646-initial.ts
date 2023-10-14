import type { Kysely } from "kysely";

export const migration1 = {
  up: async function (db: Kysely<any>): Promise<void> {
    //CREATE TABLE IF NOT EXISTS "replay" (
    //  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    //  "fullPath" varchar NOT NULL,
    //  "startTime" varchar,
    //  "lastFrame" integer,
    //  "winnerIndices" text NOT NULL,
    //  CONSTRAINT "UQ_53610720406544cbece3d7907d4" UNIQUE ("fullPath")
    //);
    await db.schema
      .createTable("replay")
      .addColumn("id", "integer", (col) => col.primaryKey())
      .addColumn("name", "varchar", (col) => col.notNull())
      .addColumn("fullPath", "varchar", (col) => col.notNull().unique())
      .addColumn("size", "integer", (col) => col.notNull())
      .addColumn("startTime", "varchar")
      .addColumn("lastFrame", "integer")
      .addColumn("winnerIndices", "text")
      .execute();
    //CREATE TABLE IF NOT EXISTS "replay_game_start" (
    //  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    //  "slpVersion" varchar,
    //  "timerType" varchar CHECK("timerType" IN ('0', '2', '3')),
    //  "inGameMode" integer,
    //  "friendlyFireEnabled" boolean,
    //  "isTeams" boolean,
    //  "stageId" integer,
    //  "startingTimerSeconds" integer,
    //  "itemSpawnBehavior" varchar CHECK(
    //    "itemSpawnBehavior" IN ('255', '0', '1', '2', '3', '4')
    //  ),
    //  "enabledItems" integer,
    //  "scene" integer,
    //  "gameMode" varchar CHECK("gameMode" IN ('2', '8', '15', '32')),
    //  "language" varchar CHECK("language" IN ('0', '1')),
    //  "randomSeed" integer,
    //  "isPAL" boolean,
    //  "isFrozenPS" boolean,
    //  "replayId" integer NOT NULL,
    //  CONSTRAINT "REL_7fafe1728a56a93587359fdc4f" UNIQUE ("replayId"),
    //  CONSTRAINT "FK_7fafe1728a56a93587359fdc4fa" FOREIGN KEY ("replayId") REFERENCES "replay" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    //);
    await db.schema
      .createTable("replay_game_start")
      .addColumn("id", "integer", (col) => col.primaryKey())
      .addColumn("slpVersion", "varchar")
      .addColumn("timerType", "integer")
      .addColumn("inGameMode", "integer")
      .addColumn("friendlyFireEnabled", "boolean")
      .addColumn("isTeams", "boolean")
      .addColumn("stageId", "integer")
      .addColumn("startingTimerSeconds", "integer")
      .addColumn("itemSpawnBehavior", "integer")
      .addColumn("enabledItems", "integer")
      .addColumn("scene", "integer")
      .addColumn("gameMode", "integer")
      .addColumn("language", "integer")
      .addColumn("randomSeed", "integer")
      .addColumn("isPAL", "boolean")
      .addColumn("isFrozenPS", "boolean")
      .addColumn("replayId", "integer", (col) => col.references("replay.id").notNull().unique())
      .execute();
    //CREATE TABLE IF NOT EXISTS "replay_metadata" (
    //  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    //  "startAt" varchar,
    //  "playedOn" varchar,
    //  "lastFrame" integer,
    //  "replayId" integer NOT NULL,
    //  CONSTRAINT "REL_309dbee86516c58624e8fb716e" UNIQUE ("replayId"),
    //  CONSTRAINT "FK_309dbee86516c58624e8fb716eb" FOREIGN KEY ("replayId") REFERENCES "replay" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    //);
    await db.schema
      .createTable("replay_metadata")
      .addColumn("id", "integer", (col) => col.primaryKey())
      .addColumn("startAt", "varchar")
      .addColumn("playedOn", "varchar")
      .addColumn("lastFrame", "integer")
      .addColumn("replayId", "integer", (col) => col.references("replay.id").notNull().unique())
      .execute();
    //CREATE TABLE IF NOT EXISTS "replay_player" (
    //  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    //  "playerIndex" integer NOT NULL,
    //  "port" integer NOT NULL,
    //  "characterId" integer,
    //  "type" integer,
    //  "startStocks" integer,
    //  "characterColor" integer,
    //  "teamShade" integer,
    //  "handicap" integer,
    //  "teamId" integer,
    //  "staminaMode" boolean,
    //  "silentCharacter" boolean,
    //  "invisible" boolean,
    //  "lowGravity" boolean,
    //  "blackStockIcon" boolean,
    //  "metal" boolean,
    //  "startOnAngelPlatform" boolean,
    //  "rumbleEnabled" boolean,
    //  "cpuLevel" integer,
    //  "offenseRatio" integer,
    //  "defenseRatio" integer,
    //  "modelScale" integer,
    //  "controllerFix" varchar,
    //  "nametag" varchar,
    //  "displayName" varchar NOT NULL,
    //  "connectCode" varchar NOT NULL,
    //  "userId" varchar NOT NULL,
    //  "settingsId" integer NOT NULL,
    //  CONSTRAINT "FK_70f3e7ff11fa156a427139a002a" FOREIGN KEY ("settingsId") REFERENCES "replay_game_start" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    //);
    await db.schema
      .createTable("replay_player")
      .addColumn("id", "integer", (col) => col.primaryKey())
      .addColumn("playerIndex", "integer", (col) => col.notNull())
      .addColumn("port", "integer", (col) => col.notNull())
      .addColumn("characterId", "integer")
      .addColumn("type", "integer")
      .addColumn("startStocks", "integer")
      .addColumn("characterColor", "integer")
      .addColumn("teamShade", "integer")
      .addColumn("handicap", "integer")
      .addColumn("teamId", "integer")
      .addColumn("staminaMode", "boolean")
      .addColumn("silentCharacter", "boolean")
      .addColumn("invisible", "boolean")
      .addColumn("lowGravity", "boolean")
      .addColumn("blackStockIcon", "boolean")
      .addColumn("metal", "boolean")
      .addColumn("startOnAngelPlatform", "boolean")
      .addColumn("rumbleEnabled", "boolean")
      .addColumn("cpuLevel", "integer")
      .addColumn("offenseRatio", "integer")
      .addColumn("defenseRatio", "integer")
      .addColumn("modelScale", "integer")
      .addColumn("controllerFix", "varchar")
      .addColumn("nametag", "varchar")
      .addColumn("displayName", "varchar", (col) => col.notNull())
      .addColumn("connectCode", "varchar", (col) => col.notNull())
      .addColumn("userId", "varchar", (col) => col.notNull())
      .addColumn("settingsId", "integer", (col) => col.references("replay_game_start.id").notNull())
      .execute();
  },

  down: async function (db: Kysely<any>): Promise<void> {
    db.schema.dropTable("replay");
    db.schema.dropTable("replay_game_start");
    db.schema.dropTable("replay_metadata");
    db.schema.dropTable("replay_player");
  },
};
