import React from 'react';
import { LogBox } from 'react-native';
import { Provider, connect } from 'react-redux';
import { createReduxContainer } from 'react-navigation-redux-helpers';
import AppNavigatorContainer from 'app/components/AppNavigator';
import configureStore from 'app/store';

LogBox.ignoreAllLogs()

const store = configureStore();

const AppWithNavigationState = createReduxContainer(AppNavigatorContainer);

const ReduxNavigator = connect(state => ({
  state: state.nav
}))(AppWithNavigationState);

const App = () => (
  <Provider store={store}>
    <ReduxNavigator />
  </Provider>
);

export default App;