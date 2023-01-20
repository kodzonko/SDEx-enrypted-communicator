import * as types from 'app/actions/chat/actionsTypes';

const initialState = {
  sending: false,
  sendingError: null,
  message: '',
  messages: {},
  loadMessagesError: null,
  users: {},
  loadUsersError: null,
  loading: false
};

const chat = (state = initialState, action) => {
  switch (action.type) {
    case types.CHAT_MESSAGE_LOADING:
      return { ...state, sending: true, sendingError: null };
    case types.CHAT_MESSAGE_ERROR:
      return { ...state, sending: false, sendingError: action.error };
    case types.CHAT_MESSAGE_SUCCESS:
      return { ...state, sending: false, sendingError: null, message: '' };
    case types.CHAT_MESSAGE_UPDATE:
      return { ...state, sending: false, message: action.text, sendingError: null };
    case types.CHAT_LOADING_MESSAGES:
      return { ...state, loading: true, loadMessagesError: null };
    case types.CHAT_LOAD_MESSAGES_SUCCESS:
      return { ...state, loading: false, messages: action.messages, loadMessagesError: null };
    case types.CHAT_LOAD_MESSAGES_ERROR:
      return { ...state, loading: false, messages: null, loadMessagesError: action.error };
    case types.CHAT_LOAD_USERS_SUCCESS:
      return { ...state, users: action.users, loadUsersError: null };
    case types.CHAT_LOAD_USERS_ERROR:
      return { ...state, users: null, loadUsersError: action.error };
    default:
      return state;
  }
};

export default chat;
