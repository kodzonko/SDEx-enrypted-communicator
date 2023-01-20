import { combineReducers } from 'redux';

import navReducer from 'app/reducers/navigation';
import sessionReducer from 'app/reducers/session';
import chatReducer from 'app/reducers/chat';

export default combineReducers({
  nav: navReducer,
  sessionReducer,
  chatReducer
});
