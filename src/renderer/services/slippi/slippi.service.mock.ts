import type { PlayKey } from "@dolphin/types";

import type { AuthService } from "../auth/types";
import { delayAndMaybeError } from "../utils";
import type { SlippiBackendService } from "./types";

const SHOULD_ERROR = false;

const fakeUsers: PlayKey[] = [
  {
    uid: "userid",
    connectCode: "DEMO#000",
    playKey: "playkey",
    displayName: "Demo user",
  },
];

class MockSlippiBackendClient implements SlippiBackendService {
  constructor(private authService: AuthService) {}

  @delayAndMaybeError(SHOULD_ERROR)
  public async validateUserId(userId: string): Promise<{ displayName: string; connectCode: string }> {
    const key = fakeUsers.find((key) => key.uid === userId);
    if (!key) {
      throw new Error("No user with that ID");
    }

    return {
      displayName: key.displayName,
      connectCode: key.connectCode,
    };
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async fetchPlayKey(): Promise<PlayKey | null> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error("No user logged in");
    }
    const key = fakeUsers.find((key) => key.uid === user.uid);
    return key ?? null;
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async assertPlayKey(_playKey: PlayKey) {
    // Do nothing
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async deletePlayKey(): Promise<void> {
    // Do nothing
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async changeDisplayName(name: string) {
    await this.authService.updateDisplayName(name);
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async initializeNetplay(_codeStart: string): Promise<void> {
    // Do nothing
  }
}

export default function createMockSlippiClient(authService: AuthService): SlippiBackendService {
  return new MockSlippiBackendClient(authService);
}
