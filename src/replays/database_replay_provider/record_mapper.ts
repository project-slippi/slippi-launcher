import type { FileRecord, GameRecord, PlayerRecord } from "@database/schema";
import type { FileResult, PlayerInfo } from "@replays/types";
import path from "path";

function mapPlayerRecordToPlayerInfo(player: PlayerRecord): PlayerInfo {
  return {
    playerIndex: player.port - 1,
    port: player.port,
    type: player.type ?? undefined,
    characterId: player.character_id ?? undefined,
    characterColor: player.character_color ?? undefined,
    teamId: player.team_id ?? undefined,
    isWinner: Boolean(player.is_winner),
    connectCode: player.connect_code ?? undefined,
    displayName: player.display_name ?? undefined,
    tag: player.tag ?? undefined,
    startStocks: player.start_stocks ?? undefined,
  };
}

export function mapGameRecordToFileResult(
  gameAndFileRecord: GameRecord & FileRecord,
  playerRecords: PlayerRecord[],
): FileResult {
  const fullPath = path.resolve(gameAndFileRecord.folder, gameAndFileRecord.name);
  return {
    id: gameAndFileRecord.file_id.toString(),
    fileName: gameAndFileRecord.name,
    fullPath,
    game: {
      players: playerRecords.map(mapPlayerRecordToPlayerInfo),
      isTeams: Boolean(gameAndFileRecord.is_teams),
      stageId: gameAndFileRecord.stage ?? undefined,
      startTime: gameAndFileRecord.start_time ?? undefined,
      platform: gameAndFileRecord.platform ?? undefined,
      consoleNickname: gameAndFileRecord.console_nickname ?? undefined,
      mode: gameAndFileRecord.mode ?? undefined,
      lastFrame: gameAndFileRecord.last_frame ?? undefined,
      timerType: gameAndFileRecord.timer_type ?? undefined,
      startingTimerSeconds: gameAndFileRecord.starting_timer_secs ?? undefined,
    },
  };
}
