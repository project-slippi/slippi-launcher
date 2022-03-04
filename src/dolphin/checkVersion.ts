import { ApolloClient, gql, HttpLink, InMemoryCache } from "@apollo/client";
import { appVersion, isDevelopment } from "@common/constants";
import { fetch } from "cross-fetch";
import type { GraphQLError } from "graphql";

import type { DolphinLaunchType, DolphinVersionResponse } from "./types";

const httpLink = new HttpLink({ uri: process.env.SLIPPI_GRAPHQL_ENDPOINT, fetch });

const client = new ApolloClient({
  link: httpLink,
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

export async function fetchLatestDolphin(
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
