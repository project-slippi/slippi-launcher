import type { Game, Player, Replay } from "@database/schema";
import type { FileResult, PlayerInfo } from "@replays/types";
import path from "path";

function mapPlayerRecordToPlayerInfo(player: Player): PlayerInfo {
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

export function mapGameRecordToFileResult(gameRecord: Game & Replay, playerRecords: Player[]): FileResult {
  const fullPath = path.resolve(gameRecord.folder, gameRecord.file_name);
  return {
    id: `${gameRecord._id}-${gameRecord.replay_id}`,
    fileName: gameRecord.file_name,
    fullPath,
    game: {
      players: playerRecords.map(mapPlayerRecordToPlayerInfo),
      isTeams: Boolean(gameRecord.is_teams),
      stageId: gameRecord.stage,
      startTime: gameRecord.start_time,
      platform: gameRecord.platform,
      consoleNickname: gameRecord.console_nickname,
      mode: gameRecord.mode,
      lastFrame: gameRecord.last_frame,
      timerType: gameRecord.timer_type,
      startingTimerSeconds: gameRecord.starting_timer_secs,
    },
  };
}
