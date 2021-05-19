import { DolphinLaunchType, findDolphinExecutable } from "common/dolphin";
import log from "electron-log";
import electronSettings from "electron-settings";
import { EventEmitter } from "events";

import { assertDolphinInstallation } from "../downloadDolphin";
import { DolphinInstance, PlaybackDolphinInstance } from "./instance";
import { ReplayCommunication } from "./types";

electronSettings.configure({
  fileName: "Settings",
  prettify: true,
});

// DolphinManager should be in control of all dolphin instances that get opened for actual use.
// This includes playing netplay, viewing replays, watching broadcasts (spectating), and configuring Dolphin.
export class DolphinManager extends EventEmitter {
  private playbackDolphinInstances = new Map<string, PlaybackDolphinInstance>();
  private netplayDolphinInstance: DolphinInstance | null = null;

  public async launchPlaybackDolphin(id: string, replayComm: ReplayCommunication): Promise<void> {
    const dolphinPath = await findDolphinExecutable(DolphinLaunchType.PLAYBACK);
    const meleeISOPath = (await electronSettings.get("settings.isoPath")) as string | undefined;

    let playbackInstance = this.playbackDolphinInstances.get(id);
    if (!playbackInstance) {
      playbackInstance = new PlaybackDolphinInstance(dolphinPath, meleeISOPath);
      playbackInstance.on("close", () => {
        this.emit("dolphin-closed", id);

        // Remove the instance from the map on close
        this.playbackDolphinInstances.delete(id);
      });
      this.playbackDolphinInstances.set(id, playbackInstance);
    }

    playbackInstance.play(replayComm);
  }

  public async launchNetplayDolphin() {
    const dolphinPath = await findDolphinExecutable(DolphinLaunchType.NETPLAY);
    const meleeISOPath = (await electronSettings.get("settings.isoPath")) as string | undefined;
    if (!this.netplayDolphinInstance) {
      this.netplayDolphinInstance = new DolphinInstance(dolphinPath, meleeISOPath);
      this.netplayDolphinInstance.on("close", () => {
        this.netplayDolphinInstance = null;
      });
    }
  }

  public async configureDolphin(launchType: DolphinLaunchType) {
    const dolphinPath = await findDolphinExecutable(launchType);
    const instance = new DolphinInstance(dolphinPath);
    instance.start();
  }

  public async resetDolphin(launchType: DolphinLaunchType) {
    switch (launchType) {
      case DolphinLaunchType.NETPLAY: {
        if (this.netplayDolphinInstance !== null) {
          log.warn("a netplay dolphin is open");
          return;
        }

        assertDolphinInstallation(launchType, log.info, true);

        break;
      }
      case DolphinLaunchType.PLAYBACK: {
        if (this.playbackDolphinInstances.size > 0) {
          log.warn("a playback dolphin is open");
          return;
        }

        assertDolphinInstallation(launchType, log.info, true);

        break;
      }
    }
  }
}

export const dolphinManager = new DolphinManager();
