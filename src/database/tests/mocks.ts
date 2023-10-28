import type { NewGame, NewPlayer, NewReplay } from "database/schema";

export function aMockReplayWith(opts: Partial<NewReplay> = {}): NewReplay {
  return {
    folder: "folder",
    file_name: "file_name",
    size_bytes: 123,
    ...opts,
  };
}

export function aMockGameWith(replayId: number, opts: Partial<NewGame> = {}): NewGame {
  return {
    replay_id: replayId,
    is_teams: 0,
    stage: 12,
    start_time: null,
    platform: "dolphin",
    console_nickname: "Wii",
    mode: 1,
    last_frame: 123,
    timer_type: 1,
    starting_timer_secs: 480,
    ...opts,
  };
}

export function aMockPlayerWith(gameId: number, opts: Partial<NewPlayer> = {}): NewPlayer {
  return {
    game_id: gameId,
    index: 0,
    type: 0,
    character_id: 1,
    character_color: 1,
    team_id: 0,
    is_winner: 0,
    start_stocks: 4,
    connect_code: "FOO#123",
    display_name: "Foo",
    tag: "FOO",
    ...opts,
  };
}
