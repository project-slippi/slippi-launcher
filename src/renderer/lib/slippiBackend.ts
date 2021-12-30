import { ApolloClient, ApolloLink, gql, HttpLink, InMemoryCache } from "@apollo/client";
import { ipc_checkPlayKeyExists, ipc_removePlayKeyFile, ipc_storePlayKeyFile } from "@dolphin/ipc";
import { PlayKey } from "@dolphin/types";
import electronLog from "electron-log";
import firebase from "firebase";
import { GraphQLError } from "graphql";

const log = electronLog.scope("slippiBackend");

const httpLink = new HttpLink({ uri: process.env.SLIPPI_GRAPHQL_ENDPOINT });

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

const getUserKeyQuery = gql`
  query getUserKeyQuery($fbUid: String) {
    getUser(fbUid: $fbUid) {
      displayName
      connectCode {
        code
      }
      private {
        playKey
      }
    }
    getLatestDolphin {
      version
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

export const initNetplayMutation = gql`
  mutation InitNetplay($codeStart: String!) {
    user_init_netplay(codeStart: $codeStart) {
      uid
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
      fbUid: user.uid,
    },
  });

  handleErrors(res.errors);

  return {
    uid: user.uid,
    connectCode: res.data.getUser.connectCode.code,
    playKey: res.data.getUser.private.playKey,
    displayName: res.data.getUser.displayName,
    latestVersion: res.data.getLatestDolphin.version,
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

  handleErrors(res.errors);

  if (res.data.user_rename.displayName !== name) {
    throw new Error("Could not change name.");
  }

  await user.updateProfile({ displayName: name });
}

export async function initNetplay(codeStart: string): Promise<void> {
  const user = firebase.auth().currentUser;
  if (!user) {
    throw new Error("Failed to set connect code. User is not logged in");
  }

  const res = await client.mutate({ mutation: initNetplayMutation, variables: { codeStart } });
  handleErrors(res.errors);
}
