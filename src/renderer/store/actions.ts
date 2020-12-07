import firebase from "firebase";

export enum Action {
  SET_USER = "SET_USER",
}

export type ActionPayload = {
  [Action.SET_USER]: {
    user: firebase.User | null;
  };
};
