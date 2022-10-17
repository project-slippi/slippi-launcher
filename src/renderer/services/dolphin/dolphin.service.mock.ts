import { delay } from "@common/delay";
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

class MockDolphinClient implements DolphinService {
  private eventSubject = new Subject<DolphinEvent>();
  private events = Observable.from(this.eventSubject);

  @delayAndMaybeError(SHOULD_ERROR)
  public async downloadDolphin(dolphinType: DolphinLaunchType): Promise<void> {
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
    });
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async configureDolphin(_dolphinType: DolphinLaunchType): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async softResetDolphin(_dolphinType: DolphinLaunchType): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async hardResetDolphin(dolphinType: DolphinLaunchType): Promise<void> {
    await this.downloadDolphin(dolphinType);
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async storePlayKeyFile(_key: PlayKey): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async checkPlayKeyExists(_key: PlayKey): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async removePlayKeyFile(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async viewSlpReplay(_files: ReplayQueueItem[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async launchNetplayDolphin(_options: { bootToCss?: boolean | undefined }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async checkDesktopAppDolphin(): Promise<{ dolphinPath: string; exists: boolean }> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async importDolphinSettings(_options: {
    toImportDolphinPath: string;
    dolphinType: DolphinLaunchType;
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public onEvent<T extends DolphinEventType>(eventType: T, handle: (event: DolphinEventMap[T]) => void): () => void {
    const subscription = this.events.filter<DolphinEventMap[T]>((event) => event.type === eventType).subscribe(handle);
    return () => subscription.unsubscribe();
  }
}

export default function createMockDolphinClient(): DolphinService {
  return new MockDolphinClient();
}
