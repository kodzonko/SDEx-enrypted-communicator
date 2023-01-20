import React, { Component } from 'react';
import { BackHandler } from 'react-native';
import { shape } from 'prop-types';
import { NavigationActions } from 'react-navigation';
import AppNavigator from './AppNavigator';

const STACK_ROUTES = ['SignedIn', 'SignedOut'];
const INITIAL_STACK_SUB_ROUTES = ['HomeTab', 'SignIn'];

const checkInitialSubRoutesPress = ({ state, dispatch }) => {
  const stackRoutes = state.routes[state.index];

  if (STACK_ROUTES.includes(stackRoutes.key)) {
    const { routeName } = stackRoutes.routes[stackRoutes.index];

    if (INITIAL_STACK_SUB_ROUTES.includes(routeName)) {
      return false;
    }
  }
  dispatch(NavigationActions.back());
  return true;
};

class AppNavigatorContainer extends Component {
  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
  }

  onBackPress = () => checkInitialSubRoutesPress(this.props.navigation);

  render() {
    return <AppNavigator />;
  }
}

AppNavigatorContainer.router = AppNavigator.router;

AppNavigatorContainer.propTypes = {
  navigation: shape({}).isRequired
};

export default AppNavigatorContainer;
