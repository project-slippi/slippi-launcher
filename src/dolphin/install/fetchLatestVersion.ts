import { ApolloClient, ApolloLink, gql, HttpLink, InMemoryCache } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { appVersion } from "@common/constants";
import { exists } from "@common/exists";
import type { SettingsManager } from "@settings/settingsManager";
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

// this function is relied by getInstallation in DolphinManager to decide which dolphin (folder) to use
// it isn't the prettiest execution but will suffice since we want to be able to let users play even if
// the stable dolphin updates before the beta dolphin. The backend will interleave the versions from github
// and return the version that is most recently published if includeBeta is true.
export async function fetchLatestVersion(
  dolphinType: DolphinLaunchType,
  includeBeta = false,
  settingsManager: SettingsManager,
): Promise<DolphinVersionResponse> {
  log.warn(`getting latest ${includeBeta ? dolphinType + "-beta" : dolphinType} dolphin`);
  const res = await client.query({
    query: getLatestDolphinQuery,
    fetchPolicy: "network-only",
    variables: {
      purpose: dolphinType.toUpperCase(),
      includeBeta: includeBeta,
    },
  });

  handleErrors(res.errors);

  // this is how i would like to handle it if we can agree to it
  // if (exists(res.data.getDolphinVersion.isBeta)) {
  //   await settingsManager.setDolphinBetaAvailable(dolphinType, res.data.getDolphinVersion.isBeta);
  // }

  if (exists(res.data.getLatestDolphin.version)) {
    const isBeta = (res.data.getLatestDolphin.version as string).includes("-beta");
    await settingsManager.setDolphinBetaAvailable(dolphinType, isBeta);
  }

  log.warn(`got url ${res.data.getLatestDolphin.windowsDownloadUrl} for v${res.data.getLatestDolphin.version}`);
  return {
    version: res.data.getLatestDolphin.version,
    downloadUrls: {
      darwin: res.data.getLatestDolphin.macDownloadUrl,
      linux: res.data.getLatestDolphin.linuxDownloadUrl,
      win32: res.data.getLatestDolphin.windowsDownloadUrl,
    },
  };
}
