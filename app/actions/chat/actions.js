import firebaseService from 'app/environments/firebase';
import * as types from './actionsTypes';

const FIREBASE_REF_USERS = firebaseService.database().ref('Users');

const sendRecordedMessage = ({ mainId, receptorId, chatMessage, dispatch }) => {
  // Store the messages on the main user
  FIREBASE_REF_USERS.child(`${mainId}/Messages/${receptorId}`)
    .push()
    .set(chatMessage, error => {
      if (error) {
        dispatch(chatMessageError(error.message));
      } else {
        dispatch(chatMessageSuccess());
      }
    });
  // Store the messages on the receptor user
  FIREBASE_REF_USERS.child(`${receptorId}/Messages/${mainId}`)
    .push()
    .set(chatMessage, error => {
      if (error) {
        dispatch(chatMessageError(error.message));
      } else {
        dispatch(chatMessageSuccess());
      }
    });
};

const getRecordedMessages = ({ mainId, receptorId, dispatch }) => {
  dispatch(loadingMessages());
  FIREBASE_REF_USERS.child(`${mainId}/Messages/${receptorId}`).on(
    'value',
    snapshot => {
      dispatch(loadMessagesSuccess(snapshot.val()));
    },
    errorObject => {
      dispatch(loadMessagesError(errorObject.message));
    }
  );
};

const generateRandomMessageId = () => Math.round(Math.random() * 1000000);

export const sendMessage = ({ message, user, receptorData }) => dispatch => {
  dispatch(chatMessageLoading());
  const { id: receptorId } = receptorData;
  const { uid: mainId, email, displayName, photoURL } = user;
  const createdAt = new Date().getTime();

  const chatMessage = {
    _id: generateRandomMessageId(),
    text: message,
    createdAt,
    user: {
      _id: mainId,
      email,
      name: displayName,
      avatar: photoURL
    },
    sent: true,
    received: false
  };
  sendRecordedMessage({ mainId, receptorId, chatMessage, dispatch });
};

export const updateMessage = text => dispatch => {
  dispatch(chatUpdateMessage(text));
};

export const loadMessages = ({ mainId, receptorId }) => dispatch => {
  getRecordedMessages({ mainId, receptorId, dispatch });
};

export const loadUsers = () => dispatch => {
  FIREBASE_REF_USERS.on(
    'value',
    snapshot => {
      dispatch(loadUsersSuccess(snapshot.val()));
    },
    errorObject => {
      dispatch(loadUsersError(errorObject.message));
    }
  );
};

const chatMessageLoading = () => ({
  type: types.CHAT_MESSAGE_LOADING
});

const chatMessageSuccess = () => ({
  type: types.CHAT_MESSAGE_SUCCESS
});

const chatMessageError = error => ({
  type: types.CHAT_MESSAGE_ERROR,
  error
});

const chatUpdateMessage = text => ({
  type: types.CHAT_MESSAGE_UPDATE,
  text
});

const loadingMessages = () => ({
  type: types.CHAT_LOADING_MESSAGES
});

const loadMessagesSuccess = messages => ({
  type: types.CHAT_LOAD_MESSAGES_SUCCESS,
  messages
});

const loadMessagesError = error => ({
  type: types.CHAT_LOAD_MESSAGES_ERROR,
  error
});

const loadUsersSuccess = users => ({
  type: types.CHAT_LOAD_USERS_SUCCESS,
  users
});

const loadUsersError = error => ({
  type: types.CHAT_LOAD_USERS_ERROR,
  error
});
