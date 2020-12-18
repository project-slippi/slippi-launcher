import * as fs from "fs-extra";
import firebase from "firebase";
import {
  gql,
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  HttpLink,
} from "@apollo/client";
import { getPlayKeyPath } from "./directories";
import { fileExists } from "common/utils";

export interface PlayKey {
  uid: string;
  playKey: string;
  connectCode: string;
}

const GRAPHQL_ENDPOINT = "https://slippi-hasura.herokuapp.com/v1/graphql";

const httpLink = new HttpLink({ uri: GRAPHQL_ENDPOINT });

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
  const keyPath = getPlayKeyPath();
  const playKeyExists = await fileExists(keyPath);
  if (!playKeyExists) {
    const playKey = await fetchPlayKey();
    const contents = JSON.stringify(playKey, null, 2);
    await fs.writeFile(keyPath, contents);
  }
}

export async function deletePlayKey(): Promise<void> {
  const keyPath = getPlayKeyPath();
  const playKeyExists = await fileExists(keyPath);
  if (playKeyExists) {
    await fs.unlink(keyPath);
  }
}
