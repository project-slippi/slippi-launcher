import { EntitySchema } from "typeorm";

export const Replay = new EntitySchema({
  name: "replay",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    fullPath: {
      type: String,
      unique: true,
    },
    startTime: {
      type: String,
      nullable: true,
    },
    lastFrame: {
      type: Number,
      nullable: true,
    },
    winnerIndices: {
      type: "simple-json",
      nullable: false,
    },
  },
  relations: {
    // Analogue to `GameStartType` in slippi-js
    settings: {
      type: "one-to-one",
      target: "replayGameStart",
      inverseSide: "replay",
      cascade: ["insert", "update", "remove"],
    },
    // Analogue to `MetadataType` in slippi-js
    metadata: {
      type: "one-to-one",
      target: "replayMetadata",
      inverseSide: "replay",
      cascade: ["insert", "update", "remove"],
      nullable: true,
    },
  } as any,
});
