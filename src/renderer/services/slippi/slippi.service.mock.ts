import { currentRulesVersion } from "@common/constants";
import { Preconditions } from "@common/preconditions";
import type { PlayKey } from "@dolphin/types";

import type { AuthService } from "../auth/types";
import { delayAndMaybeError } from "../utils";
import { generateMockChatMessage, generateUserSubscriptionLevel } from "./mockSlippiDataUtils";
import type { ChatMessageData, SlippiBackendService, UserData } from "./types";

const SHOULD_ERROR = false;

const fakeUserId = "userid";

type SavedUserData = UserData & { savedMessages: string[] };

const savedMessages = [
  "ggs",
  "one more",
  "brb",
  "good luck",

  "well played",
  "that was fun",
  "thanks",
  "too good",

  "sorry",
  "my b",
  "lol",
  "wow",

  "gotta go",
  "one sec",
  "let's play again later",
  "bad connection",
];

class MockSlippiBackendClient implements SlippiBackendService {
  private fakeUsers: Map<string, SavedUserData> = new Map();

  constructor(private authService: AuthService) {
    this.addFakeSlippiUser(fakeUserId);
  }

  private addFakeSlippiUser(userId: string, displayName?: string): void {
    const numUsers = this.fakeUsers.size;
    this.fakeUsers.set(userId, {
      playKey: {
        uid: userId,
        connectCode: `DEMO#${numUsers}`,
        playKey: "playkey",
        displayName: displayName ?? `Demo user ${numUsers}`,
      },
      rulesAccepted: 0,
      savedMessages,
    });
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async validateUserId(userId: string): Promise<{ displayName: string; connectCode: string }> {
    const userData = this.fakeUsers.get(userId);
    if (!userData || !userData.playKey) {
      throw new Error(`No user with ID: ${userId}`);
    }

    return {
      displayName: userData.playKey.displayName,
      connectCode: userData.playKey.connectCode,
    };
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async fetchUserData(): Promise<UserData | null> {
    const user = this.authService.getCurrentUser();
    Preconditions.checkExists(user, "No user logged in");

    if (!this.fakeUsers.has(user.uid)) {
      this.addFakeSlippiUser(user.uid, user.displayName);
    }
    const userData = this.fakeUsers.get(user.uid);
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
    const user = this.authService.getCurrentUser();
    Preconditions.checkExists(user, "No user logged in");

    const userData = this.fakeUsers.get(user.uid);
    Preconditions.checkExists(userData, `No user with id: ${user.uid}`);

    userData.playKey!.displayName = name;
    this.fakeUsers.set(user.uid, userData);
    await this.authService.updateDisplayName(name);
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async acceptRules() {
    const user = this.authService.getCurrentUser();
    Preconditions.checkExists(user, "No user logged in");
    const userData = this.fakeUsers.get(user.uid);
    Preconditions.checkExists(userData, `No user with id: ${user.uid}`);

    userData.rulesAccepted = currentRulesVersion;
    this.fakeUsers.set(user.uid, userData);
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async initializeNetplay(_codeStart: string): Promise<void> {
    // Do nothing
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async fetchChatMessageData(userId: string): Promise<ChatMessageData> {
    const userData = this.fakeUsers.get(userId);
    Preconditions.checkExists(userData, "User not found");

    const displayName = userData.playKey!.displayName.toLowerCase();
    const subscriptionLevel = generateUserSubscriptionLevel(displayName.includes("sub"));

    return {
      level: subscriptionLevel,
      availableMessages: [...generateMockChatMessage(10, false), ...generateMockChatMessage(20, true)],
      userMessages: userData.savedMessages,
    };
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async submitChatMessages(userId: string, messages: string[]): Promise<string[]> {
    const userData = this.fakeUsers.get(userId);
    Preconditions.checkExists(userData, "User not found");

    userData.savedMessages = messages;
    this.fakeUsers.set(userId, userData);
    return messages;
  }
}

export default function createMockSlippiClient(authService: AuthService): SlippiBackendService {
  return new MockSlippiBackendClient(authService);
}
