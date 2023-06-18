import { GameMode, ItemSpawnType, Language, TimerType } from "@slippi/slippi-js";
import { EntitySchema } from "typeorm";

export const ReplayGameStart = new EntitySchema({
  name: "replayGameStart",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    slpVersion: {
      type: String,
      nullable: true,
    },
    timerType: {
      type: "simple-enum",
      enum: TimerType,
      nullable: true,
    },
    inGameMode: {
      type: Number,
      nullable: true,
    },
    friendlyFireEnabled: {
      type: Boolean,
      nullable: true,
    },
    isTeams: {
      type: Boolean,
      nullable: true,
    },
    stageId: {
      type: Number,
      nullable: true,
    },
    startingTimerSeconds: {
      type: Number,
      nullable: true,
    },
    itemSpawnBehavior: {
      type: "simple-enum",
      enum: ItemSpawnType,
      nullable: true,
    },
    enabledItems: {
      type: Number,
      nullable: true,
    },
    scene: {
      type: Number,
      nullable: true,
    },
    gameMode: {
      type: "simple-enum",
      enum: GameMode,
      nullable: true,
    },
    language: {
      type: "simple-enum",
      enum: Language,
      nullable: true,
    },
    randomSeed: {
      type: Number,
      nullable: true,
    },
    isPAL: {
      type: Boolean,
      nullable: true,
    },
    isFrozenPS: {
      type: Boolean,
      nullable: true,
    },
    replayId: {
      type: Number,
    },
  },
  relations: {
    replay: {
      type: "one-to-one",
      target: "replay",
      invserSide: "settings",
      joinColumn: {
        name: "replayId",
      },
      orphanedRowAction: "delete",
    },
    players: {
      type: "one-to-many",
      target: "replayPlayer",
      invserSide: "settings",
      cascade: ["insert", "update", "remove"],
    },
  } as any,
});
