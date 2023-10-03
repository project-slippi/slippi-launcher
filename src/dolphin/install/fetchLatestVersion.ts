import { ApolloClient, ApolloLink, gql, HttpLink, InMemoryCache } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { appVersion } from "@common/constants";
import { exists } from "@common/exists";
import type { SettingsManager } from "@settings/settingsManager";
import { fetch } from "cross-fetch";
import { app } from "electron";
import electronLog from "electron-log";
import { move, remove } from "fs-extra";
import type { GraphQLError } from "graphql";
import os from "os";
import path from "path";

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
  const res = await client.query({
    query: getLatestDolphinQuery,
    fetchPolicy: "network-only",
    variables: {
      purpose: dolphinType.toUpperCase(),
      includeBeta: includeBeta,
    },
  });

  handleErrors(res.errors);

  if (exists(res.data.getLatestDolphin.promoteToStable)) {
    const promoteToStable = (res.data.getLatestDolphin.promoteToStable as string) === "true";
    const currentPromoteToStable = settingsManager.getDolphinPromoteToStable(dolphinType);
    if (promoteToStable && !currentPromoteToStable) {
      // if this is the first time we're handling the promotion then delete {dolphinType}-beta and move {dolphinType}
      // we want to delete the beta folder so that any defaults that got changed during the beta are properly updated
      const betaPath = path.join(app.getPath("userData"), `${dolphinType.toLowerCase()}-beta`);
      const oldStablePath = path.join(app.getPath("userData"), dolphinType.toLowerCase());
      const legacyPath = path.join(app.getPath("userData"), `${dolphinType.toLowerCase()}-legacy`);
      try {
        await remove(betaPath);
        await move(oldStablePath, legacyPath, { overwrite: true });
        if (process.platform === "darwin") {
          // mainline on macOS will take over the old user folder so move it on promotion
          // windows keeps everything contained in the install dir
          // linux will be using a new user folder path
          const configPath = path.join(os.homedir(), "Library", "Application Support", "com.project-slippi.dolphin");
          const oldUserFolderName = `${dolphinType.toLowerCase()}/User`;
          const bkpFolderName = `${dolphinType.toLowerCase()}/User-bkp`;
          const oldPath = path.join(configPath, oldUserFolderName);
          const newPath = path.join(configPath, bkpFolderName);
          await move(oldPath, newPath, { overwrite: true });
        }
      } catch {
        // likely a new install so ignore this
      }
    }
    await settingsManager.setDolphinPromoteToStable(dolphinType, promoteToStable);
  }

  if (exists(res.data.getLatestDolphin.version)) {
    const isBeta = (res.data.getLatestDolphin.version as string).includes("-beta");
    await settingsManager.setDolphinBetaAvailable(dolphinType, isBeta);
  }

  return {
    version: res.data.getLatestDolphin.version,
    downloadUrls: {
      darwin: res.data.getLatestDolphin.macDownloadUrl,
      linux: res.data.getLatestDolphin.linuxDownloadUrl,
      win32: res.data.getLatestDolphin.windowsDownloadUrl,
    },
  };
}
