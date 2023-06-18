import { EntitySchema } from "typeorm";

export const ReplayMetadata = new EntitySchema({
  name: "replayMetadata",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    startAt: {
      type: String,
      nullable: true,
    },
    playedOn: {
      type: String,
      nullable: true,
    },
    lastFrame: {
      type: Number,
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
      invserseSide: "metadata",
      joinColumn: {
        name: "replayId",
      },
      orphanedRowAction: "delete",
    },
  } as any,
});
