import type { NormalizedCacheObject } from "@apollo/client";
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import type { DolphinService, PlayKey } from "@dolphin/types";
import type { GraphQLError } from "graphql";

import type { AuthService } from "../auth/types";
import {
  MUTATION_INIT_NETPLAY,
  MUTATION_RENAME_USER,
  QUERY_GET_USER_KEY,
  QUERY_VALIDATE_USER_ID,
} from "./graphqlEndpoints";
import type { SlippiBackendService } from "./types";

const log = window.electron.log;
const SLIPPI_BACKEND_URL = process.env.SLIPPI_GRAPHQL_ENDPOINT;

const handleErrors = (errors: readonly GraphQLError[] | undefined) => {
  if (errors) {
    let errMsgs = "";
    errors.forEach((err) => {
      errMsgs += `${err.message}\n`;
    });
    throw new Error(errMsgs);
  }
};

class SlippiBackendClient implements SlippiBackendService {
  private client: ApolloClient<NormalizedCacheObject>;

  constructor(
    private readonly authService: AuthService,
    private readonly dolphinService: DolphinService,
    clientVersion?: string,
  ) {
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
    const errorLink = onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.map(({ message, locations, path }) =>
          log.error(`Apollo GQL Error: Message: ${message}, Location: ${locations}, Path: ${path}`),
        );
      }
      if (networkError) {
        log.error(`Apollo Network Error: ${networkError}`);
      }
    });

    const apolloLink = ApolloLink.from([authLink, errorLink, retryLink, httpLink]);
    this.client = new ApolloClient({
      link: apolloLink,
      cache: new InMemoryCache(),
      name: "slippi-launcher",
      version: clientVersion,
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

    if (res.data.getUser) {
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

  public async fetchPlayKey(): Promise<PlayKey | null> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error("User is not logged in");
    }

    const res = await this.client.query({
      query: QUERY_GET_USER_KEY,
      variables: {
        fbUid: user.uid,
      },
      fetchPolicy: "network-only",
    });

    handleErrors(res.errors);

    const connectCode = res.data.getUser?.connectCode?.code;
    const playKey = res.data.getUser?.private?.playKey;
    const displayName = res.data.getUser?.displayName || "";
    if (!connectCode || !playKey) {
      // If we don't have a connect code or play key, return this as null such that logic that
      // handles it will cause the user to set them up.
      return null;
    }

    return {
      uid: user.uid,
      connectCode,
      playKey,
      displayName,
      latestVersion: res.data.getLatestDolphin?.version,
    };
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
    if (!user) {
      throw new Error("User is not logged in");
    }

    const res = await this.client.mutate({
      mutation: MUTATION_RENAME_USER,
      variables: { fbUid: user.uid, displayName: name },
    });

    handleErrors(res.errors);

    if (res.data?.userRename?.displayName !== name) {
      throw new Error("Could not change name.");
    }

    await this.authService.updateDisplayName(name);
  }

  public async initializeNetplay(codeStart: string): Promise<void> {
    const res = await this.client.mutate({ mutation: MUTATION_INIT_NETPLAY, variables: { codeStart } });
    handleErrors(res.errors);
  }
}

export default function createSlippiClient(
  authService: AuthService,
  dolphinService: DolphinService,
  clientVersion?: string,
): SlippiBackendService {
  return new SlippiBackendClient(authService, dolphinService, clientVersion);
}
