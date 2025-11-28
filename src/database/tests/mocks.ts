import type { NewFile, NewGame, NewPlayer } from "@database/schema";

export function aMockFileWith(opts: Partial<NewFile> = {}): NewFile {
  return {
    folder: "folder",
    name: "file_name",
    size_bytes: 123,
    ...opts,
  };
}

export function aMockGameWith(fileId: number, opts: Partial<NewGame> = {}): NewGame {
  return {
    file_id: fileId,
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
    port: 1,
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
