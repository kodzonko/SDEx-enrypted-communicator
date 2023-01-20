import React from 'react';

const navigateToCreator = navigation => routeName => params => navigation.navigate({ routeName, params });

// eslint-disable-next-line
export const withNavigation = Component => ({ navigation, screenProps }) => (
  <Component
    navigation={navigation}
    navigateTo={navigateToCreator(navigation)}
    goBack={navigation.goBack}
    addOnWillFocusListener={listener => navigation.addListener('willFocus', listener)}
    params={navigation.state.params}
    setParams={navigation.setParams}
    getParam={navigation.getParam}
    isFocused={navigation.isFocused}
    popToTop={navigation.popToTop}
    screenProps={screenProps}
  />
);

export const mergeNavigatorProps = (stateProps, dispatchProps, { navigation, screenProps }) => ({
  navigation,
  screenProps: {
    ...screenProps,
    ...stateProps,
    ...dispatchProps
  }
});

export const getNavigationOptions = ({ title }) => ({
  title,
  headerStyle: {
    backgroundColor: '#2299ec'
  },
  headerTintColor: 'white'
});
