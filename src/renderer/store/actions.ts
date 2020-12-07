import firebase from "firebase";

export enum Action {
  SET_INITIALIZED = "SET_INITIALIZED",
  SET_USER = "SET_USER",
  SET_INSTALL_STATUS = "SET_INSTALL_STATUS",
}

export type ActionPayload = {
  [Action.SET_USER]: {
    user: firebase.User | null;
  };
  [Action.SET_INSTALL_STATUS]: string;
  [Action.SET_INITIALIZED]: never;
};
