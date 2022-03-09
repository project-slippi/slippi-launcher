import type { PlayKey } from "@dolphin/types";

import type { AuthService } from "../authService/types";
import type { SlippiBackendService } from "./types";

const fakeUsers: PlayKey[] = [
  {
    uid: "userid",
    connectCode: "DEMO#000",
    playKey: "playkey",
    displayName: "Demo user",
  },
];

export class MockSlippiBackendClient implements SlippiBackendService {
  public constructor(private authService: AuthService) {}
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

  public async fetchPlayKey(): Promise<PlayKey | null> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error("No user logged in");
    }
    const key = fakeUsers.find((key) => key.uid === user.uid);
    return key ?? null;
  }

  public async assertPlayKey(_playKey: PlayKey) {
    // Do nothing
  }

  public async deletePlayKey(): Promise<void> {
    // Do nothing
  }

  public async changeDisplayName(name: string) {
    await this.authService.updateDisplayName(name);
  }

  public async initializeNetplay(_codeStart: string): Promise<void> {
    // Do nothing
  }
}
