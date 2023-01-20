import firebaseService from 'app/environments/firebase';
import * as types from './actionsTypes';

const FIREBASE_REF_USERS = firebaseService.database().ref('Users');
const randomNum = Math.floor(Math.random() * 8);
const avatar = `https://randomuser.me/api/portraits/lego/${randomNum}.jpg`;

const createUser = ({ user, name, email, dispatch }) => {
  const id = user.uid;
  return FIREBASE_REF_USERS.child(id)
    .set({
      id,
      name,
      email,
      avatar
    })
    .then(() => {
      updateUser({ user, name, dispatch });
    });
};

const updateUser = ({ user, name, dispatch }) =>
  user
    .updateProfile({
      displayName: name,
      photoURL: avatar
    })
    .then(() => {
      dispatch(signupSuccess(user));
    });

export const restoreSession = () => dispatch => {
  dispatch(sessionLoading());
  firebaseService.auth().onAuthStateChanged(user => {
    if (user) {
      dispatch(sessionSuccess(user));
    } else {
      dispatch(sessionLogout());
    }
  });
};

export const loginUser = ({ email, password }) => dispatch => {
  dispatch(sessionLoading());
  firebaseService
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then(user => {
      dispatch(sessionSuccess(user));
    })
    .catch(error => {
      dispatch(sessionError(error.message));
    });
};

export const signupUser = ({ name, email, password }) => dispatch => {
  dispatch(sessionLoading());
  firebaseService
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then(authData => {
      createUser({ user: authData.user, name, email, dispatch });
    })
    .catch(error => {
      dispatch(sessionError(error.message));
    });
};

export const logoutUser = () => dispatch => {
  dispatch(sessionLoading());
  firebaseService
    .auth()
    .signOut()
    .then(() => {
      dispatch(sessionLogout());
    })
    .catch(error => {
      dispatch(sessionError(error.message));
    });
};

const sessionLoading = () => ({
  type: types.SESSION_LOADING
});

const sessionSuccess = user => ({
  type: types.SESSION_SUCCESS,
  user
});

const signupSuccess = user => ({
  type: types.SIGNUP_SUCCESS,
  user
});

const sessionError = error => ({
  type: types.SESSION_ERROR,
  error
});

const sessionLogout = () => ({
  type: types.SESSION_LOGOUT
});
