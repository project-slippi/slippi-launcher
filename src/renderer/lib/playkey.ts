import { ApolloClient, ApolloLink, gql, HttpLink, InMemoryCache } from "@apollo/client";
import { checkPlayKeyExists, removePlayKeyFile, storePlayKeyFile } from "@dolphin/ipc";
import { PlayKey } from "@dolphin/types";
import log from "electron-log";
import firebase from "firebase";

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
  }
`;

export async function fetchPlayKey(): Promise<PlayKey> {
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

export async function assertPlayKey() {
  const playKeyExistsResult = await checkPlayKeyExists.renderer!.trigger({});
  if (!playKeyExistsResult.result) {
    log.error("Error checking for play key.", playKeyExistsResult.errors);
    throw new Error("Error checking for play key");
  }

  if (playKeyExistsResult.result.exists) {
    return;
  }

  const playKey = await fetchPlayKey();
  const storeResult = await storePlayKeyFile.renderer!.trigger({ key: playKey });
  if (!storeResult.result) {
    log.error("Error saving play key", storeResult.errors);
    throw new Error("Error saving play key");
  }
}

export async function deletePlayKey(): Promise<void> {
  const deleteResult = await removePlayKeyFile.renderer!.trigger({});
  if (!deleteResult.result) {
    log.error("Error deleting play key", deleteResult.errors);
    throw new Error("Error deleting play key");
  }
}
