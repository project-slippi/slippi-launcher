import type { FileResult, PlayerInfo } from "@replays/types";
import type { Game, Player, Replay } from "database/schema";
import moment from "moment";
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
      startTime: inferStartTime(gameRecord.start_time, gameRecord.file_name, gameRecord.birth_time),
      platform: gameRecord.platform,
      consoleNickname: gameRecord.console_nickname,
      mode: gameRecord.mode,
      lastFrame: gameRecord.last_frame,
      timerType: gameRecord.timer_type,
      startingTimerSeconds: gameRecord.starting_timer_secs,
    },
  };
}

function inferStartTime(gameStartAt: string | null, fileName: string, fileBirthTime: string | null): string | null {
  let startAt = convertToDateAndTime(gameStartAt);
  if (startAt) {
    return startAt.toISOString();
  }

  startAt = inferDateFromFilename(fileName);
  if (startAt) {
    return startAt.toISOString();
  }

  startAt = convertToDateAndTime(fileBirthTime);
  return startAt?.toISOString() ?? null;
}

function convertToDateAndTime(dateTimeString: moment.MomentInput): moment.Moment | null {
  if (dateTimeString == null) {
    return null;
  }

  const asMoment = moment(dateTimeString);
  if (asMoment.isValid()) {
    return asMoment.local();
  }

  return null;
}

function inferDateFromFilename(fileName: string): moment.Moment | null {
  const timeReg = /\d{8}T\d{6}/g;
  const filenameTime = fileName.match(timeReg);

  if (filenameTime == null) {
    return null;
  }

  const time = moment(filenameTime[0]).local();
  return time;
}
