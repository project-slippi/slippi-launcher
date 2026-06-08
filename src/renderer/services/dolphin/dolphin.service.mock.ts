import { delay } from "@common/delay";
import type { GeckoCode } from "@dolphin/config/gecko_code";
import type {
  DolphinDownloadProgressEvent,
  DolphinEvent,
  DolphinEventMap,
  DolphinLaunchType,
  DolphinService,
  PlayKey,
  ReplayQueueItem,
} from "@dolphin/types";
import { DolphinEventType } from "@dolphin/types";
import { Observable, Subject } from "observable-fns";

import { delayAndMaybeError } from "../utils";

const SHOULD_ERROR = false;
const DOLPHIN_VERSION = "9.8.7";

class MockDolphinClient implements DolphinService {
  private eventSubject = new Subject<DolphinEvent>();
  private events = Observable.from(this.eventSubject);

  @delayAndMaybeError(SHOULD_ERROR)
  async downloadDolphin(dolphinType: DolphinLaunchType): Promise<void> {
    // Mock installation percentage
    for (let i = 0; i <= 100; i++) {
      const progressEvent: DolphinDownloadProgressEvent = {
        type: DolphinEventType.DOWNLOAD_PROGRESS,
        dolphinType,
        progress: {
          current: i,
          total: 100,
        },
      };
      await delay(50);
      this.eventSubject.next(progressEvent);
    }

    // Mark our download as complete
    this.eventSubject.next({
      type: DolphinEventType.DOWNLOAD_COMPLETE,
      dolphinType,
      dolphinVersion: DOLPHIN_VERSION,
    });
  }

  @delayAndMaybeError(SHOULD_ERROR)
  async configureDolphin(_dolphinType: DolphinLaunchType): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  async softResetDolphin(_dolphinType: DolphinLaunchType): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  async hardResetDolphin(dolphinType: DolphinLaunchType): Promise<void> {
    await this.downloadDolphin(dolphinType);
  }

  @delayAndMaybeError(SHOULD_ERROR)
  async storePlayKeyFile(_key: PlayKey): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  async checkPlayKeyExists(_key: PlayKey): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  async removePlayKeyFile(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  async viewSlpReplay(_files: ReplayQueueItem[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  async launchNetplayDolphin(_options: { bootToCss?: boolean | undefined }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  async openDolphinSettingsFolder(_dolphinType: DolphinLaunchType): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  async fetchGeckoCodes(_dolphinLaunchType: DolphinLaunchType): Promise<GeckoCode[]> {
    throw new Error("Method not implemented.");
  }
  @delayAndMaybeError(SHOULD_ERROR)
  async saveGeckoCodes(_dolphinLaunchType: DolphinLaunchType, _geckoCodes: GeckoCode[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  async installRosetta(): Promise<{ exitCode: number }> {
    return { exitCode: 0 };
  }

  onEvent<T extends DolphinEventType>(eventType: T, handle: (event: DolphinEventMap[T]) => void): () => void {
    const subscription = this.events.filter<DolphinEventMap[T]>((event) => event.type === eventType).subscribe(handle);
    return () => subscription.unsubscribe();
  }
}

export default function createMockDolphinClient(): DolphinService {
  return new MockDolphinClient();
}
