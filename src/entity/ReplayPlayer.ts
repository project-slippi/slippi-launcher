import { EntitySchema } from "typeorm";

export const ReplayPlayer = new EntitySchema({
  name: "replayPlayer",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    playerIndex: {
      type: Number,
    },
    port: {
      type: Number,
      unique: true,
    },
    characterId: {
      type: Number,
      nullable: true,
    },
    type: {
      type: Number,
      nullable: true,
    },
    startStocks: {
      type: Number,
      nullable: true,
    },
    characterColor: {
      type: Number,
      nullable: true,
    },
    teamShade: {
      type: Number,
      nullable: true,
    },
    handicap: {
      type: Number,
      nullable: true,
    },
    teamId: {
      type: Number,
      nullable: true,
    },
    staminaMode: {
      type: Boolean,
      nullable: true,
    },
    silentCharacter: {
      type: Boolean,
      nullable: true,
    },
    invisible: {
      type: Boolean,
      nullable: true,
    },
    lowGravity: {
      type: Boolean,
      nullable: true,
    },
    blackStockIcon: {
      type: Boolean,
      nullable: true,
    },
    metal: {
      type: Boolean,
      nullable: true,
    },
    startOnAngelPlatform: {
      type: Boolean,
      nullable: true,
    },
    rumbleEnabled: {
      type: Boolean,
      nullable: true,
    },
    cpuLevel: {
      type: Number,
      nullable: true,
    },
    offenseRatio: {
      type: Number,
      nullable: true,
    },
    defenseRatio: {
      type: Number,
      nullable: true,
    },
    modelScale: {
      type: Number,
      nullable: true,
    },
    controllerFix: {
      type: String,
      nullable: true,
    },
    nametag: {
      type: String,
      nullable: true,
    },
    displayName: {
      type: String,
    },
    connectCode: {
      type: String,
    },
    userId: {
      type: String,
    },
    settingsId: {
      type: Number,
    },
  },
  relations: {
    settings: {
      type: "many-to-one",
      target: "replayGameStart",
      joinColumn: {
        name: "settingsId",
      },
      orphanedRowAction: "delete",
    },
  } as any,
});
