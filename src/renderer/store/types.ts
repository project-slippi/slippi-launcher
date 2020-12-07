import firebase from "firebase";

export interface InitialStateType {
  initialized: boolean;
  user: firebase.User | null;
  installStatus: string;
}
