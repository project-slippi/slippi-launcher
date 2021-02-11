import { DolphinType } from "./directories";
import { remote } from "electron";
import { randomBytes } from "crypto";
import { assertDolphinInstallation, openDolphin } from "./downloadDolphin";
import { assertPlayKey } from "./playkey";
import * as fs from "fs-extra";

import path from "path";

export interface ReplayCommunication {
  mode?: string;
  replay?: string;
  startFrame?: number;
  endFrame?: number;
  commandId?: string;
  outputOverlayFiles?: boolean;
  isRealTimeMode?: boolean;
  shouldResync?: boolean;
  rollbackDisplayMethod?: string;
  queue?: ReplayQueueItem[];
}

export interface ReplayQueueItem {
  path: string;
  startFrame?: number;
  endFrame?: number;
  gameStartAt?: string;
  gameStation?: string;
}

export async function startGame(log: (status: string) => void, meleeFile?: string): Promise<void> {
  log("Checking for Dolphin installation...");
  await assertDolphinInstallation(DolphinType.NETPLAY, log);

  log("Checking user account...");
  await assertPlayKey();

  if (!meleeFile) {
    throw new Error("Melee ISO is not specified");
  }

  log("Starting game...");
  openDolphin(DolphinType.NETPLAY, ["-b", "-e", meleeFile]);
}

export async function startReplay(log: (status: string) => void, replayComm: ReplayCommunication, meleeFile?: string) {
  log("Checking for Dolphin installation...");
  await assertDolphinInstallation(DolphinType.PLAYBACK, log);

  if (!meleeFile) {
    throw new Error("Melee ISO is not specified");
  }

  const replayCommPath = await generateCommunicationFilePath();

  await fs.writeFile(replayCommPath, JSON.stringify(replayComm));

  log("Starting replay...");
  const dolphin = await openDolphin(DolphinType.PLAYBACK, ["-i", replayCommPath, "-b", "-e", meleeFile]);
  dolphin.on("close", () => {
    log(`deleting ${replayCommPath}`);
    fs.unlink(replayCommPath);
  });
}

async function generateCommunicationFilePath(): Promise<string> {
  const tmpDir = remote.app.getPath("temp");
  const uniqueId = randomBytes(3 * 4).toString("hex");
  const commFileName = `slippi-comm-${uniqueId}.txt`;
  const commFileFullPath = path.join(tmpDir, commFileName);

  return commFileFullPath;
}
