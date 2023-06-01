import { Provider as PaperProvider } from "react-native-paper";
import "setimmediate";
import { useAuthStore } from "./components/Contexts";
import AuthenticatedBottomTabNavigator from "./components/navigation/AuthenticatedBottomTabNavigator";
import UnauthenticatedStackNavigator from "./components/navigation/UnauthenticatedStackNavigator";
import { theme } from "./components/Styles";

function App() {
  const isSignedIn = useAuthStore((state) => state.isSignedIn);
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
