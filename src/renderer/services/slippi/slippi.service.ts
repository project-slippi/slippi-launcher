import type { ErrorLike } from "@apollo/client";
import {
  ApolloClient,
  ApolloLink,
  CombinedGraphQLErrors,
  CombinedProtocolErrors,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { ErrorLink } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { currentRulesVersion } from "@common/constants";
import { Preconditions } from "@common/preconditions";
import type { DolphinService, PlayKey } from "@dolphin/types";
import log from "electron-log";

import type { AuthService } from "../auth/types";
import {
  MUTATION_ACCEPT_RULES,
  MUTATION_INIT_NETPLAY,
  MUTATION_RENAME_USER,
  MUTATION_SUBMIT_CHAT_MESSAGES,
  QUERY_CHAT_MESSAGE_DATA,
  QUERY_GET_USER_DATA,
  QUERY_VALIDATE_USER_ID,
} from "./graphqlEndpoints";
import type { AvailableMessageType, ChatMessageData, SlippiBackendService, UserData } from "./types";

const SLIPPI_BACKEND_URL = process.env.SLIPPI_GRAPHQL_ENDPOINT;

const handleErrors = (error: ErrorLike | undefined) => {
  if (error) {
    let errMsg = error.message;
    if (error instanceof CombinedGraphQLErrors) {
      error.errors.forEach((err) => {
        errMsg += `${err.message}\n`;
      });
    }
    throw new Error(errMsg);
  }
};

class SlippiBackendClient implements SlippiBackendService {
  private client: ApolloClient;

  constructor(
    private readonly authService: AuthService,
    private readonly dolphinService: DolphinService,
    clientVersion?: string,
  ) {
    this.client = this._createApolloClient(clientVersion);
  }

  private _createApolloClient(clientVersion?: string) {
    const httpLink = new HttpLink({ uri: SLIPPI_BACKEND_URL });
    const authLink = setContext(async () => {
      // The firebase ID token expires after 1 hour so we will update the header on all actions
      const token = await this.authService.getUserToken();

      return {
        headers: {
          authorization: token ? `Bearer ${token}` : undefined,
        },
      };
    });
    const retryLink = new RetryLink({
      delay: {
        initial: 300,
        max: Infinity,
        jitter: true,
      },
      attempts: {
        max: 3,
        retryIf: (error) => Boolean(error),
      },
    });
    const errorLink = new ErrorLink(({ error, operation }) => {
      if (CombinedGraphQLErrors.is(error)) {
        error.errors.forEach(({ message, locations, path }) =>
          log.error(
            `Apollo GQL Error: Message: ${message}, Location: ${locations}, Path: ${path}, Operation: ${operation.operationName}`,
          ),
        );
      } else if (CombinedProtocolErrors.is(error)) {
        error.errors.forEach(({ message, extensions }) =>
          log.error(`Apollo Protocol Error: Message: ${message}, Extensions: ${JSON.stringify(extensions)}`),
        );
      } else {
        log.error(`Apollo Network Error: ${error}`);
      }
    });

    const apolloLink = ApolloLink.from([authLink, errorLink, retryLink, httpLink]);
    return new ApolloClient({
      link: apolloLink,
      cache: new InMemoryCache(),

      clientAwareness: {
        name: "slippi-launcher",
        version: clientVersion,
      },
    });
  }

  public async validateUserId(userId: string): Promise<{ displayName: string; connectCode: string }> {
    const res = await this.client.query({
      query: QUERY_VALIDATE_USER_ID,
      variables: {
        fbUid: userId,
      },
      fetchPolicy: "network-only",
    });

    if (res.data?.getUser) {
      const { connectCode, displayName } = res.data.getUser;
      if (connectCode?.code) {
        return {
          connectCode: connectCode.code,
          displayName: displayName ?? "",
        };
      }
    }

    throw new Error("No user with that ID");
  }

  public async fetchUserData(): Promise<UserData | null> {
    const user = this.authService.getCurrentUser();
    Preconditions.checkExists(user, "User is not logged in");

    const res = await this.client.query({
      query: QUERY_GET_USER_DATA,
      variables: {
        fbUid: user.uid,
      },
      fetchPolicy: "network-only",
    });

    handleErrors(res.error);

    if (!res.data) {
      throw Error("failed to get user info");
    }

    const connectCode = res.data.getUser?.connectCode?.code;
    const playKey = res.data.getUser?.private?.playKey;
    const displayName = res.data.getUser?.displayName || "";

    // If we don't have a connect code or play key, return it as null such that logic that
    // handles it will cause the user to set them up.
    let playKeyObj: PlayKey | null = null;
    if (connectCode && playKey) {
      playKeyObj = {
        uid: user.uid,
        connectCode,
        playKey,
        displayName,
        latestVersion: res.data.getLatestDolphin?.version,
      };
    }

    return {
      playKey: playKeyObj,
      rulesAccepted: res.data.getUser?.rulesAccepted ?? 0,
    };
  }

  public async fetchChatMessageData(userId: string): Promise<ChatMessageData> {
    const res = await this.client.query({
      query: QUERY_CHAT_MESSAGE_DATA,
      variables: {
        fbUid: userId,
      },
      fetchPolicy: "network-only",
    });

    handleErrors(res.error);

    if (!res.data) {
      throw Error("failed to get chat data");
    }

    return {
      level: res.data.getUser?.activeSubscription?.level ?? "NONE",
      userMessages: res.data.getUser?.activeChatMessages ?? [],
      availableMessages: (res.data.getChatMessageOptions ?? []).filter((msg) => msg) as AvailableMessageType[],
    };
  }

  public async submitChatMessages(uid: string, messages: string[]): Promise<string[]> {
    const res = await this.client.mutate({
      mutation: MUTATION_SUBMIT_CHAT_MESSAGES,
      variables: { fbUid: uid, messages },
    });
    handleErrors(res.error);

    return res.data?.userSetChatMessages?.activeChatMessages ?? [];
  }

  public async assertPlayKey(playKey: PlayKey) {
    const playKeyExists = await this.dolphinService.checkPlayKeyExists(playKey);
    if (playKeyExists) {
      return;
    }

    await this.dolphinService.storePlayKeyFile(playKey);
  }

  public async deletePlayKey(): Promise<void> {
    await this.dolphinService.removePlayKeyFile();
  }

  public async changeDisplayName(name: string) {
    const user = this.authService.getCurrentUser();
    Preconditions.checkExists(user, "User is not logged in");

    const res = await this.client.mutate({
      mutation: MUTATION_RENAME_USER,
      variables: { fbUid: user.uid, displayName: name },
    });

    handleErrors(res.error);

    if (res.data?.userRename?.displayName !== name) {
      throw new Error("Could not change name.");
    }

    await this.authService.updateDisplayName(name);
  }

  public async acceptRules() {
    const user = this.authService.getCurrentUser();
    Preconditions.checkExists(user, "User is not logged in");

    const res = await this.client.mutate({
      mutation: MUTATION_ACCEPT_RULES,
      variables: { num: currentRulesVersion },
    });

    handleErrors(res.error);

    if (res.data?.userAcceptRules?.rulesAccepted !== currentRulesVersion) {
      throw new Error("Could not accept rules");
    }
  }

  public async initializeNetplay(codeStart: string): Promise<void> {
    const res = await this.client.mutate({ mutation: MUTATION_INIT_NETPLAY, variables: { codeStart } });
    handleErrors(res.error);
  }
}

export default function createSlippiClient(
  authService: AuthService,
  dolphinService: DolphinService,
  clientVersion?: string,
): SlippiBackendService {
  return new SlippiBackendClient(authService, dolphinService, clientVersion);
}
