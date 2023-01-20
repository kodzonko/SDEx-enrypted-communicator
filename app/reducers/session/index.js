import * as types from 'app/actions/session/actionsTypes';

const initialState = {
  loading: false,
  user: {},
  error: null,
  logged: false,
  registered: false
};

const sessionReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.SESSION_LOADING:
      return { ...state, loading: true };
    case types.SESSION_SUCCESS:
      return {
        ...state,
        user: action.user,
        logged: true,
        loading: false
      };
    case types.SIGNUP_SUCCESS:
      return {
        ...state,
        user: action.user,
        registered: true,
        loading: false
      };
    case types.SESSION_ERROR:
      return {
        ...state,
        error: action.error,
        loading: false
      };
    case types.SESSION_LOGOUT:
      return initialState;
    default:
      return state;
  }
};

export default sessionReducer;
