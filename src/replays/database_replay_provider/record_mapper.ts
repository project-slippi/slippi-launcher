import type { FileRecord, GameRecord, PlayerRecord } from "@database/schema";
import type { FileResult, PlayerInfo } from "@replays/types";
import path from "path";

function mapPlayerRecordToPlayerInfo(player: PlayerRecord): PlayerInfo {
  return {
    playerIndex: player.port - 1,
    port: player.port,
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

export function mapGameRecordToFileResult(
  gameAndFileRecord: GameRecord & FileRecord,
  playerRecords: PlayerRecord[],
): FileResult {
  const fullPath = path.resolve(gameAndFileRecord.folder, gameAndFileRecord.name);
  return {
    id: `${gameAndFileRecord._id}-${gameAndFileRecord.file_id}`,
    fileName: gameAndFileRecord.name,
    fullPath,
    game: {
      players: playerRecords.map(mapPlayerRecordToPlayerInfo),
      isTeams: Boolean(gameAndFileRecord.is_teams),
      stageId: gameAndFileRecord.stage,
      startTime: gameAndFileRecord.start_time,
      platform: gameAndFileRecord.platform,
      consoleNickname: gameAndFileRecord.console_nickname,
      mode: gameAndFileRecord.mode,
      lastFrame: gameAndFileRecord.last_frame,
      timerType: gameAndFileRecord.timer_type,
      startingTimerSeconds: gameAndFileRecord.starting_timer_secs,
    },
  };
}
