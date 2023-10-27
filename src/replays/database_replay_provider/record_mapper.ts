import type { PlayerInfo } from "@replays/types";
import type { Player } from "database/schema";

export function mapPlayerRecordToPlayerInfo(player: Player): PlayerInfo {
  return {
    playerIndex: player.index,
    port: player.index + 1,
    type: player.type,
    characterId: player.character_id,
    characterColor: player.character_color,
    teamId: player.team_id,
    isWinner: Boolean(player.is_winner),
    connectCode: player.connect_code,
    displayName: player.display_name,
    tag: player.tag,
    startStocks: player.start_stocks,
  };
}
