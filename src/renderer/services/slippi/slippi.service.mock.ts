import type { PlayKey } from "@dolphin/types";

import type { AuthService } from "../auth/types";
import { delayAndMaybeError } from "../utils";
import type { SlippiBackendService, UserData } from "./types";

const SHOULD_ERROR = false;

const fakeUsers: UserData[] = [
  {
    playKey: {
      uid: "userid",
      connectCode: "DEMO#000",
      playKey: "playkey",
      displayName: "Demo user",
    },
    rulesAccepted: 0,
  },
];

class MockSlippiBackendClient implements SlippiBackendService {
  constructor(private authService: AuthService) {}

  @delayAndMaybeError(SHOULD_ERROR)
  public async validateUserId(userId: string): Promise<{ displayName: string; connectCode: string }> {
    const userData = fakeUsers.find((userData) => userData.playKey?.uid === userId);
    if (!userData || !userData.playKey) {
      throw new Error("No user with that ID");
    }

    return {
      displayName: userData.playKey.displayName,
      connectCode: userData.playKey.connectCode,
    };
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async fetchUserData(): Promise<UserData | null> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error("No user logged in");
    }
    const userData = fakeUsers.find((userData) => userData.playKey?.uid === user.uid);
    return userData ?? null;
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
  public async acceptRules() {
    // TODO: make it possible to accept the rules in the mock
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async initializeNetplay(_codeStart: string): Promise<void> {
    // Do nothing
  }
}

export default function createMockSlippiClient(authService: AuthService): SlippiBackendService {
  return new MockSlippiBackendClient(authService);
}
