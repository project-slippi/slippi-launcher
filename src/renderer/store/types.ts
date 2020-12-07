import firebase from "firebase";

export interface InitialStateType {
  user: firebase.User | null;
}
