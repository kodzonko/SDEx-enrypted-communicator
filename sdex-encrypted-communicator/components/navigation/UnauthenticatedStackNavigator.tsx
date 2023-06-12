import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import { UnauthenticatedStackNavigationParamList } from "../Types";

const Stack = createNativeStackNavigator<UnauthenticatedStackNavigationParamList>();

function UnauthenticatedStackNavigator(props: any) {
  return (
    <NavigationContainer theme={props.theme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default UnauthenticatedStackNavigator;
