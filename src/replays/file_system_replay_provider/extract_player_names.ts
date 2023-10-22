import type { GameStartType, MetadataType } from "@slippi/slippi-js";
import get from "lodash/get";

type PlayerNames = {
  name: string;
  code: string;
  tag: string;
};

export function extractPlayerNames(
  index: number,
  settings: GameStartType,
  metadata?: MetadataType | null,
): PlayerNames {
  const result: PlayerNames = {
    name: "",
    code: "",
    tag: "",
  };

  const player = settings.players.find((player) => player.playerIndex === index);
  result.tag = player?.nametag ?? "";
  result.name = player?.displayName || get(metadata, ["players", index, "names", "netplay"], "");
  result.code = player?.connectCode || get(metadata, ["players", index, "names", "code"], "");

  return result;
}
