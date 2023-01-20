/* eslint-disable global-require */
import React from 'react';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import SingInContainer from 'app/components/Auth/SingIn';
import SignUpContainer from 'app/components/Auth/SignUp';
import HomeContainer from 'app/components/Home';
import Users from 'app/components/Users';
import Messages from 'app/components/Chat';
import { withNavigation, getNavigationOptions } from './utils';

const TabNavigator = createBottomTabNavigator(
  {
    HomeTab: {
      screen: withNavigation(({ navigateTo, navigation }) => (
        <HomeContainer onSignOut={navigateTo('SignIn')} navigation={navigation} />
      )),
      navigationOptions: {
        tabBarLabel: 'Home',
        tabBarIcon: <Icon name="home" size={30} color="gray" />
      }
    },
    UsersTab: {
      screen: withNavigation(({ navigateTo }) => (
        <Users goToMessage={({ id, name }) => navigateTo('Messages')({ id, name })} />
      )),
      navigationOptions: {
        tabBarLabel: 'Chat',
        tabBarIcon: <Icon name="comments" size={30} color="gray" />
      }
    }
  },
  {
    initialRouteName: 'UsersTab'
  }
);

const ModalStackNavigator = createStackNavigator(
  {
    Tab: {
      screen: TabNavigator
    },
    Messages: {
      screen: Messages,
      navigationOptions: ({ navigation: { state } }) => {
        const { name: title } = state.params;
        return { ...getNavigationOptions({ title }) };
      }
    }
  },
  {
    mode: 'card'
  }
);

const SignedOutNavigator = createStackNavigator(
  {
    SignIn: {
      screen: withNavigation(({ navigateTo }) => (
        <SingInContainer onSignUp={navigateTo('SignUp')} onSignedIn={navigateTo('SignedIn')} />
      ))
    },
    SignUp: {
      screen: withNavigation(({ navigateTo }) => <SignUpContainer onSignedIn={navigateTo('SignedIn')} />)
    }
  },
  {
    defaultNavigationOptions: {
      headerStyle: {
        backgroundColor: '#2299ec'
      }
    },
    initialRouteName: 'SignIn'
  }
);

const SignedInNavigator = props => <ModalStackNavigator {...props} />

SignedInNavigator.router = ModalStackNavigator.router;

const MainNavigator = createSwitchNavigator({
  SignedOut: {
    screen: SignedOutNavigator
  },
  SignedIn: {
    screen: SignedInNavigator
  }
});

export default createAppContainer(MainNavigator);
