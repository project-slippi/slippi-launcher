import { auth } from 'firebase';

export const SET_AUTH_USER = 'SET_AUTH_USER';
export const SET_AUTH_LOADING = 'SET_AUTH_LOADING';
export const SET_AUTH_ERROR = 'SET_AUTH_ERROR';

export function setAuthUser(user) {
  return async dispatch => {
    dispatch({
      type: SET_AUTH_USER,
      user: user,
    });
  };
}

export function login(email, password) {
  return async (dispatch) => {
    // Clear any existing errors
    dispatch({
      type: SET_AUTH_ERROR,
      error: null,
    });

    // Set loading state
    dispatch({
      type: SET_AUTH_LOADING,
      loading: true,
    });

    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (err) {
      console.error(err);
      dispatch({
        type: SET_AUTH_ERROR,
        error: err.message,
      });
    }

    // Clear loading state
    dispatch({
      type: SET_AUTH_LOADING,
      loading: false,
    });
  };
}

export function logout() {
  return async () => {
    await auth().signOut();
  };
}
