import type { TypedDocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";

import type { AvailableMessageType } from "./types";

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
  rulesAccepted: number;
  private: Nullable<PrivateUserInfo>;
  activeChatMessages: string[];
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

export const QUERY_GET_USER_DATA: TypedDocumentNode<
  {
    getUser: Nullable<Pick<User, "displayName" | "connectCode" | "private" | "rulesAccepted">>;
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
      rulesAccepted
    }
    getLatestDolphin {
      version
    }
  }
`;

export const QUERY_CHAT_MESSAGE_DATA: TypedDocumentNode<
  {
    getUser: Nullable<{ activeSubscription: Nullable<{ level: string }>; activeChatMessages: string[] }>;
    queryChatMessage: Nullable<Nullable<AvailableMessageType>[]>;
  },
  {
    fbUid: string;
  }
> = gql`
  query GetChatMessageConfigData($fbUid: String) {
    getUser(fbUid: $fbUid) {
      activeSubscription {
        level
      }
      activeChatMessages
    }
    queryChatMessage {
      isPaid
      text
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

export const MUTATION_ACCEPT_RULES: TypedDocumentNode<
  {
    userAcceptRules: Nullable<Pick<User, "rulesAccepted">>;
  },
  { num: number }
> = gql`
  mutation AcceptRules($num: Int!) {
    userAcceptRules(num: $num) {
      rulesAccepted
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

export const MUTATION_SUBMIT_CHAT_MESSAGES: TypedDocumentNode<
  {
    userSetChatMessages: Nullable<Pick<User, "fbUid" | "activeChatMessages">>;
  },
  {
    fbUid: string;
    messages: string[];
  }
> = gql`
  mutation UserSetChatMessages($fbUid: String!, $messages: [String!]!) {
    userSetChatMessages(fbUid: $fbUid, messages: $messages) {
      fbUid
      activeChatMessages
    }
  }
`;
