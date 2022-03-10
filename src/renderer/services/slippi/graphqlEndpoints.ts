import type { TypedDocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";

type Nullable<T> = T | null;

type ConnectCode = {
  code: string;
};

type PrivateUserInfo = {
  playKey: Nullable<string>;
};

type User = {
  connectCode: Nullable<ConnectCode>;
  displayName: Nullable<string>;
  fbUid: string;
  private: Nullable<PrivateUserInfo>;
};

type DolphinRelease = {
  version: string;
};

export const QUERY_VALIDATE_USER_ID: TypedDocumentNode<
  { getUser: Nullable<Pick<User, "connectCode" | "displayName">> },
  { fbUid: string }
> = gql`
  query validateUserIdQuery($fbUid: String) {
    getUser(fbUid: $fbUid) {
      displayName
      connectCode {
        code
      }
    }
  }
`;

export const QUERY_GET_USER_KEY: TypedDocumentNode<
  {
    getUser: Nullable<Pick<User, "displayName" | "connectCode" | "private">>;
    getLatestDolphin: Nullable<Pick<DolphinRelease, "version">>;
  },
  {
    fbUid: string;
  }
> = gql`
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

export const MUTATION_RENAME_USER: TypedDocumentNode<
  {
    userRename: Nullable<Pick<User, "displayName">>;
  },
  { fbUid: string; displayName: string }
> = gql`
  mutation RenameUser($fbUid: String!, $displayName: String!) {
    userRename(fbUid: $fbUid, displayName: $displayName) {
      displayName
    }
  }
`;

export const MUTATION_INIT_NETPLAY: TypedDocumentNode<
  {
    userInitNetplay: Nullable<Pick<User, "fbUid">>;
  },
  {
    codeStart: string;
  }
> = gql`
  mutation InitNetplay($codeStart: String!) {
    userInitNetplay(codeStart: $codeStart) {
      fbUid
    }
  }
`;
