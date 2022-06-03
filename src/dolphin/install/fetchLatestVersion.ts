import { ApolloClient, ApolloLink, gql, HttpLink, InMemoryCache } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { appVersion } from "@common/constants";
import { fetch } from "cross-fetch";
import electronLog from "electron-log";
import type { GraphQLError } from "graphql";

import type { DolphinLaunchType } from "../types";

export type DolphinVersionResponse = {
  version: string;
  downloadUrls: {
    darwin: string;
    linux: string;
    win32: string;
  };
};

const log = electronLog.scope("dolphin/checkVersion");
const isDevelopment = process.env.NODE_ENV !== "production";

const httpLink = new HttpLink({ uri: process.env.SLIPPI_GRAPHQL_ENDPOINT, fetch });
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 5,
    retryIf: (error, _operation) => !!error,
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

const apolloLink = ApolloLink.from([errorLink, retryLink, httpLink]);

const client = new ApolloClient({
  link: apolloLink,
  cache: new InMemoryCache(),
  name: "slippi-launcher",
  version: `${appVersion}${isDevelopment ? "-dev" : ""}`,
});

const getLatestDolphinQuery = gql`
  query GetLatestDolphin($purpose: DolphinPurpose, $includeBeta: Boolean) {
    getLatestDolphin(purpose: $purpose, includeBeta: $includeBeta) {
      linuxDownloadUrl
      windowsDownloadUrl
      macDownloadUrl
      version
    }
  }
`;

const handleErrors = (errors: readonly GraphQLError[] | undefined) => {
  if (errors) {
    let errMsgs = "";
    errors.forEach((err) => {
      errMsgs += `${err.message}\n`;
    });
    throw new Error(errMsgs);
  }
};

export async function fetchLatestVersion(
  dolphinType: DolphinLaunchType,
  beta = false,
): Promise<DolphinVersionResponse> {
  const res = await client.query({
    query: getLatestDolphinQuery,
    fetchPolicy: "network-only",
    variables: {
      purpose: dolphinType.toUpperCase(),
      includeBeta: beta,
    },
  });

  handleErrors(res.errors);

  return {
    version: res.data.getLatestDolphin.version,
    downloadUrls: {
      darwin: res.data.getLatestDolphin.macDownloadUrl,
      linux: res.data.getLatestDolphin.linuxDownloadUrl,
      win32: res.data.getLatestDolphin.windowsDownloadUrl,
    },
  };
}
