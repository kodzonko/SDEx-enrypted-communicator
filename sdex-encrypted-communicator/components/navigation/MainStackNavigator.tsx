import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import AuthContext from "../AuthContext";
import ChatScreen from "../screens/ChatScreen";
import LoginScreen from "../screens/LoginScreen";
import SettingsScreen from "../screens/SettingsScreen";
import SignUpScreen from "../screens/SignUpScreen";
import BottomTabNavigator from "./BottomTabNavigator";

const Stack = createNativeStackNavigator();
const MainStackNavigator = (props: any) => {
  const { isSignedIn, setIsSignedIn, keyPair, setKeyPair } =
    React.useContext(AuthContext);
  return (
    <NavigationContainer theme={props.theme}>
      <Stack.Navigator>
        {isSignedIn ? (
          <>
            <Stack.Screen
              name="Home"
              component={BottomTabNavigator}
              options={{
                headerShown: false,
                animationTypeForReplace: props.isSignedIn ? "pop" : "push",
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                headerShown: false,
                animationTypeForReplace: props.isSignedIn ? "pop" : "push",
              }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{
                headerShown: false,
                animationTypeForReplace: props.isSignedIn ? "pop" : "push",
              }}
            />
          </>
        )}
        {/*<Stack.Screen*/}
        {/*  name="Home"*/}
        {/*  component={BottomTabNavigator}*/}
        {/*  options={{*/}
        {/*    headerShown: false, animationTypeForReplace: props.isSignedIn ? "pop" : "push"*/}
        {/*  }}*/}
        {/*/>*/}
        {/*<Stack.Screen*/}
        {/*  name="Login"*/}
        {/*  component={LoginScreen}*/}
        {/*  options={{*/}
        {/*    headerShown: false, animationTypeForReplace: props.isSignedIn ? "pop" : "push"*/}
        {/*  }}*/}
        {/*/>*/}
        {/*<Stack.Screen*/}
        {/*  name="SignUp"*/}
        {/*  component={SignUpScreen}*/}
        {/*  options={{*/}
        {/*    headerShown: false, animationTypeForReplace: props.isSignedIn ? "pop" : "push"*/}
        {/*  }}*/}
        {/*/>*/}
        {/*<Stack.Screen name="Settings" component={SettingsScreen} options={{*/}
        {/*  headerShown: false, animationTypeForReplace: props.isSignedIn ? "pop" : "push"*/}
        {/*}} />*/}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainStackNavigator;
