import { withExpoSnack } from "nativewind";
import * as React from "react";
import { PaperProvider } from "react-native-paper";
import "setimmediate";
import AuthenticatedBottomTabNavigator from "./components/navigation/AuthenticatedBottomTabNavigator";
import UnauthenticatedStackNavigator from "./components/navigation/UnauthenticatedStackNavigator";
import { theme } from "./components/Styles";

function App() {
  // const isSignedIn = useAuthStore((state) => state.isSignedIn);
  const isSignedIn = true;
  return (
    <PaperProvider theme={theme}>
      {isSignedIn ? (
        <AuthenticatedBottomTabNavigator theme={theme} />
      ) : (
        <UnauthenticatedStackNavigator theme={theme} />
      )}
    </PaperProvider>
  );
}

export default withExpoSnack(App);
