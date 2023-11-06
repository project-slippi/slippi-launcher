import type { FileResult, FolderResult, GameInfo, PlayerInfo } from "@replays/types";

export function aMockPlayerWith(opts: Partial<PlayerInfo> = { playerIndex: 0 }): PlayerInfo {
  return {
    playerIndex: opts.playerIndex!,
    port: opts.playerIndex! + 1,
    type: 1,
    characterId: 0,
    characterColor: 0,
    teamId: null,
    isWinner: false,
    connectCode: "FOO#123",
    displayName: "Foo",
    tag: null,
    startStocks: 4,
    ...opts,
  };
}

export function aMockFileResultWith(
  containingFolder: string,
  opts: Partial<FileResult> = { fileName: "Game_20230113T234326.slp" },
): FileResult {
  const fullPath = containingFolder + "/" + opts.fileName!;
  return {
    id: fullPath,
    fileName: opts.fileName!,
    fullPath,
    game: aMockGameWith(),
    ...opts,
  };
}

export function aMockGameWith(opts: Partial<GameInfo> = {}): GameInfo {
  return {
    players: [
      aMockPlayerWith({ playerIndex: 0, port: 1 }),
      aMockPlayerWith({ playerIndex: 1, port: 2, connectCode: "BAR#456", displayName: "Bar" }),
    ],
    isTeams: false,
    stageId: 12,
    startTime: "2023-11-06T11:51:59.366Z",
    platform: "Dolphin",
    consoleNickname: null,
    mode: 0x08,
    lastFrame: 15600,
    timerType: 0b10,
    startingTimerSeconds: 480,
    ...opts,
  };
}

export function aMockFolderResultWith(
  parentFolder: string,
  opts: Partial<FolderResult> = { name: "some-folder" },
): FolderResult {
  const folderName = opts.name!;
  const fullPath = `${parentFolder}/${folderName}`;
  return {
    name: folderName,
    fullPath,
    subdirectories: [],
    ...opts,
  };
}
