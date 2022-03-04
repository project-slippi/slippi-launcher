import { ApolloClient, ApolloLink, gql, HttpLink, InMemoryCache } from "@apollo/client";
import { appVersion, isDevelopment } from "@common/constants";
import type { PlayKey } from "@dolphin/types";
import firebase from "firebase";
import type { GraphQLError } from "graphql";

const httpLink = new HttpLink({ uri: process.env.SLIPPI_GRAPHQL_ENDPOINT });

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  name: "slippi-launcher",
  version: `${appVersion}${isDevelopment ? "-dev" : ""}`,
});

const validateUserIdQuery = gql`
  query validateUserIdQuery($fbUid: String) {
    getUser(fbUid: $fbUid) {
      displayName
      connectCode {
        code
      }
    }
  }
`;

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
  mutation RenameUser($fbUid: String!, $displayName: String!) {
    userRename(fbUid: $fbUid, displayName: $displayName) {
      displayName
    }
  }
`;

export const initNetplayMutation = gql`
  mutation InitNetplay($codeStart: String!) {
    userInitNetplay(codeStart: $codeStart) {
      fbUid
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

// The firebase ID token expires after 1 hour so we will refresh it for actions that require it.
async function refreshFirebaseAuth(): Promise<firebase.User> {
  const user = firebase.auth().currentUser;
  if (!user) {
    throw new Error("User is not logged in.");
  }

  const token = await user.getIdToken();

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

  return user;
}

export async function validateUserId(userId: string): Promise<{ displayName: string; connectCode: string }> {
  const res = await client.query({
    query: validateUserIdQuery,
    variables: {
      fbUid: userId,
    },
    fetchPolicy: "network-only",
  });

  if (res.data?.getUser) {
    const { connectCode, displayName } = res.data.getUser;
    if (connectCode.code) {
      return {
        connectCode: connectCode.code,
        displayName,
      };
    }
  }

  throw new Error("No user with that ID");
}

export async function fetchPlayKey(): Promise<PlayKey | null> {
  const user = await refreshFirebaseAuth();

  const res = await client.query({
    query: getUserKeyQuery,
    variables: {
      fbUid: user.uid,
    },
    fetchPolicy: "network-only",
  });

  handleErrors(res.errors);

  const connectCode = res.data.getUser?.connectCode?.code;
  const playKey = res.data.getUser?.private?.playKey;
  const displayName = res.data.getUser?.displayName || "";
  if (!connectCode || !playKey) {
    // If we don't have a connect code or play key, return this as null such that logic that
    // handles it will cause the user to set them up.
    return null;
  }

  return {
    uid: user.uid,
    connectCode,
    playKey,
    displayName,
    latestVersion: res.data.getLatestDolphin?.version,
  };
}

export async function assertPlayKey(playKey: PlayKey) {
  const playKeyExists = await window.electron.dolphin.checkPlayKeyExists(playKey);
  if (playKeyExists) {
    return;
  }

  await window.electron.dolphin.storePlayKeyFile(playKey);
}

export async function deletePlayKey(): Promise<void> {
  await window.electron.dolphin.removePlayKeyFile();
}

export async function changeDisplayName(name: string) {
  const user = await refreshFirebaseAuth();

  const res = await client.mutate({ mutation: renameUserMutation, variables: { fbUid: user.uid, displayName: name } });

  handleErrors(res.errors);

  if (res.data.userRename.displayName !== name) {
    throw new Error("Could not change name.");
  }

  await user.updateProfile({ displayName: name });
}

export async function initNetplay(codeStart: string): Promise<void> {
  await refreshFirebaseAuth();

  const res = await client.mutate({ mutation: initNetplayMutation, variables: { codeStart } });
  handleErrors(res.errors);
}
