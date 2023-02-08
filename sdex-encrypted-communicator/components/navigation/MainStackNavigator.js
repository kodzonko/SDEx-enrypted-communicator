import BottomTabNavigator from "./BottomTabNavigator";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthContext from "../AuthContext";
import { NavigationContainer } from "@react-navigation/native";
import SettingsScreen from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator();
const MainStackNavigator = (props) => {
  const { isSignedIn, setIsSignedIn, keyPair, setKeyPair } = React.useContext(AuthContext);
  return (<NavigationContainer theme={props.theme}>
    <Stack.Navigator>
      {isSignedIn ? <><Stack.Screen
          name="Home"
          component={BottomTabNavigator}
          options={{
            headerShown: false, animationTypeForReplace: props.isSignedIn ? "pop" : "push"
          }}
        />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{
            headerShown: false
          }} /></>
        :
        <><Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false, animationTypeForReplace: props.isSignedIn ? "pop" : "push"
          }}
        />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{
              headerShown: false, animationTypeForReplace: props.isSignedIn ? "pop" : "push"
            }}
          />
        </>}
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
  </NavigationContainer>);
};

export default MainStackNavigator;