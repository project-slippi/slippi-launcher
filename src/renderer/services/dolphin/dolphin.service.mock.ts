import type {
  DolphinEventMap,
  DolphinEventType,
  DolphinLaunchType,
  DolphinService,
  PlayKey,
  ReplayQueueItem,
} from "@dolphin/types";

class MockDolphinClient implements DolphinService {
  public async downloadDolphin(_dolphinType: DolphinLaunchType): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public async configureDolphin(_dolphinType: DolphinLaunchType): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public async reinstallDolphin(_dolphinType: DolphinLaunchType): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public async clearDolphinCache(_dolphinType: DolphinLaunchType): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public async storePlayKeyFile(_key: PlayKey): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public async checkPlayKeyExists(_key: PlayKey): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  public async removePlayKeyFile(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public async viewSlpReplay(_files: ReplayQueueItem[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public async launchNetplayDolphin(_options: { bootToCss?: boolean | undefined }): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public async checkDesktopAppDolphin(): Promise<{ dolphinPath: string; exists: boolean }> {
    throw new Error("Method not implemented.");
  }
  public async importDolphinSettings(_options: {
    toImportDolphinPath: string;
    dolphinType: DolphinLaunchType;
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public onEvent<T extends DolphinEventType>(_eventType: T, _handle: (event: DolphinEventMap[T]) => void): () => void {
    throw new Error("Method not implemented.");
  }
}

export default function createMockDolphinClient(): DolphinService {
  return new MockDolphinClient();
}
