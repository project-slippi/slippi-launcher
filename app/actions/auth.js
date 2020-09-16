import { auth } from 'firebase';

export const SET_AUTH_USER = 'SET_AUTH_USER';

export function setAuthUser(user) {
  return async (dispatch) => {
    dispatch({
      type: SET_AUTH_USER,
      user: user,
    })
  }
}

export function login(email, password) {
  return async () => {
    await auth().signInWithEmailAndPassword(email, password);
  }
}

export function logout() {
  return async () => {
    await auth().signOut();
  }
}
