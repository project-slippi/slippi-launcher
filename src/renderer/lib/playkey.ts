import { ApolloClient, ApolloLink, gql, HttpLink, InMemoryCache } from "@apollo/client";
import { fileExists } from "common/utils";
import firebase from "firebase";
import * as fs from "fs-extra";
import path from "path";

import { DolphinType, findDolphinExecutable } from "./directories";

export interface PlayKey {
  uid: string;
  playKey: string;
  connectCode: string;
}

const httpLink = new HttpLink({ uri: process.env.SLIPPI_GRAPHQL_ENDPOINT });

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

const getUserKey = gql`
  query GetUserKey($uid: String!) {
    user(uid: $uid) {
      connectCode
      isOnlineEnabled
      private {
        playKey
      }
    }
    dolphinVersions(order_by: { releasedAt: desc }, limit: 1) {
      version
    }
  }
`;

async function fetchPlayKey(): Promise<PlayKey> {
  const user = firebase.auth().currentUser;
  if (!user) {
    throw new Error("Failed to get play key. User is not logged in");
  }

  const token = user ? await user.getIdToken() : "";

  const authLink = new ApolloLink((operation, forward) => {
    // Use the setContext method to set the HTTP headers.
    operation.setContext({
      headers: {
        authorization: token ? `Bearer ${token}` : "",
      },
    });

    // Call the next link in the middleware chain.
    return forward(operation);
  });
  client.setLink(authLink.concat(httpLink));

  const res = await client.query({
    query: getUserKey,
    variables: {
      uid: user.uid,
    },
  });
  if (!res.data.user.isOnlineEnabled) {
    throw new Error("User is not allowed online");
  }

  return {
    uid: user.uid,
    connectCode: res.data.user.connectCode,
    playKey: res.data.user.private.playKey,
  };
}

export async function assertPlayKey(): Promise<void> {
  const keyPath = await findPlayKey();
  const playKeyExists = await fileExists(keyPath);
  if (!playKeyExists) {
    const playKey = await fetchPlayKey();
    const contents = JSON.stringify(playKey, null, 2);
    await fs.writeFile(keyPath, contents);
  }
}

async function findPlayKey(): Promise<string> {
  const dolphinPath = await findDolphinExecutable(DolphinType.NETPLAY);
  let dolphinDir = path.dirname(dolphinPath);
  if (process.platform === "darwin") {
    dolphinDir = path.join(dolphinPath, "Contents", "Resources");
  }
  return path.resolve(dolphinDir, "user.json");
}

export async function deletePlayKey(): Promise<void> {
  const keyPath = await findPlayKey();
  const playKeyExists = await fileExists(keyPath);
  if (playKeyExists) {
    await fs.unlink(keyPath);
  }
}
