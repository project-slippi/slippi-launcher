import type { ErrorLike, TypedDocumentNode } from "@apollo/client";
import {
  ApolloClient,
  ApolloLink,
  CombinedGraphQLErrors,
  CombinedProtocolErrors,
  gql,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { appVersion } from "@common/constants";
import { fetch } from "cross-fetch";
import electronLog from "electron-log";

import type { DolphinLaunchType } from "../types";

export type DolphinVersionResponse = {
  version: string;
  windowsDownloadUrl: string;
  macDownloadUrl: string;
  linuxDownloadUrl: string;
};

const log = electronLog.scope("dolphin/fetchLatestVersion");
const isDevelopment = process.env.NODE_ENV !== "production";

const httpLink = new HttpLink({ uri: process.env.SLIPPI_GRAPHQL_ENDPOINT, fetch });
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

const apolloLink = ApolloLink.from([errorLink, retryLink, httpLink]);

const client = new ApolloClient({
  link: apolloLink,
  cache: new InMemoryCache(),

  clientAwareness: {
    name: "slippi-launcher",
    version: `${appVersion}${isDevelopment ? "-dev" : ""}`,
  },
});

const QUERY_GET_LATEST_DOLPHIN: TypedDocumentNode<
  {
    getLatestDolphin: DolphinVersionResponse;
  },
  {
    purpose: string;
    includeBeta: boolean;
  }
> = gql`
  query GetLatestDolphin($purpose: DolphinPurpose, $includeBeta: Boolean) {
    getLatestDolphin(purpose: $purpose, includeBeta: $includeBeta) {
      linuxDownloadUrl
      windowsDownloadUrl
      macDownloadUrl
      version
    }
  }
`;

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

// this function is relied by getInstallation in DolphinManager to decide which dolphin (folder) to use
// it isn't the prettiest execution but will suffice since we want to be able to let users play even if
// the stable dolphin updates before the beta dolphin. The backend will interleave the versions from github
// and return the version that is most recently published if includeBeta is true.
export async function fetchLatestVersion(
  dolphinType: DolphinLaunchType,
  includeBeta = false,
): Promise<DolphinVersionResponse> {
  const res = await client.query({
    query: QUERY_GET_LATEST_DOLPHIN,
    fetchPolicy: "network-only",
    variables: {
      purpose: dolphinType.toUpperCase(),
      includeBeta: includeBeta,
    },
  });

  handleErrors(res.error);

  if (!res.data) {
    throw Error("failed to get latest dolphin version");
  }

  return res.data.getLatestDolphin;
}
