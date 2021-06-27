import { ApolloClient, ApolloLink, gql, HttpLink, InMemoryCache } from "@apollo/client";
import { ipc_checkPlayKeyExists, ipc_removePlayKeyFile, ipc_storePlayKeyFile } from "@dolphin/ipc";
import { PlayKey } from "@dolphin/types";
import log from "electron-log";
import firebase from "firebase";

const httpLink = new HttpLink({ uri: process.env.SLIPPI_GRAPHQL_ENDPOINT });

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

const getUserKeyQuery = gql`
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

const renameUserMutation = gql`
  mutation RenameUser($uid: String!, $displayName: String!) {
    user_rename(uid: $uid, displayName: $displayName) {
      uid
      displayName
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
    query: getUserKeyQuery,
    variables: {
      uid: user.uid,
    },
    fetchPolicy: "network-only",
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

export async function assertPlayKey(playKey: PlayKey) {
  const playKeyExistsResult = await ipc_checkPlayKeyExists.renderer!.trigger({});
  if (!playKeyExistsResult.result) {
    log.error("Error checking for play key.", playKeyExistsResult.errors);
    throw new Error("Error checking for play key");
  }

  if (playKeyExistsResult.result.exists) {
    return;
  }

  const storeResult = await ipc_storePlayKeyFile.renderer!.trigger({ key: playKey });
  if (!storeResult.result) {
    log.error("Error saving play key", storeResult.errors);
    throw new Error("Error saving play key");
  }
}

export async function deletePlayKey(): Promise<void> {
  const deleteResult = await ipc_removePlayKeyFile.renderer!.trigger({});
  if (!deleteResult.result) {
    log.error("Error deleting play key", deleteResult.errors);
    throw new Error("Error deleting play key");
  }
}

export async function changeDisplayName(name: string) {
  const user = firebase.auth().currentUser;
  if (!user) {
    throw new Error("Failed to change display name. User is not logged in");
  }
  const res = await client.mutate({ mutation: renameUserMutation, variables: { uid: user.uid, displayName: name } });

  if (res.data.user_rename.displayName !== name) {
    throw new Error("Could not change name.");
  }

  await user.updateProfile({ displayName: name });
}
