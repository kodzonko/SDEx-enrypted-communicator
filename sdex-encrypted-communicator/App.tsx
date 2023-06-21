import { NavigationContainer } from "@react-navigation/native";
import { withExpoSnack } from "nativewind";
import * as React from "react";
import { PaperProvider } from "react-native-paper";
import "setimmediate";
import AuthenticatedStackNavigator from "./src/navigation/AuthenticatedStackNavigator";
import UnauthenticatedStackNavigator from "./src/navigation/UnauthenticatedStackNavigator";
import { theme } from "./src/Styles";

function App() {
  // const isSignedIn = useAuthStore((state) => state.isSignedIn);
  const isSignedIn = true;
  // React.useEffect(() => {
  //   (async () => {
  //     const sqlTemplateAsset = (await Asset.loadAsync(require("./assets/SqlDbTemplate.db")))[0];
  // await FileSystem.deleteAsync(FileSystem.documentDirectory + "SQLite/SqlDbTemplate.db");
  // console.log("exists: " + (await FileSystem.getInfoAsync(sqlTemplateAsset.localUri)).uri);
  // })();
  // }, []);

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={theme}>
        {isSignedIn ? (
          <AuthenticatedStackNavigator theme={theme} />
        ) : (
          <UnauthenticatedStackNavigator theme={theme} />
        )}
      </NavigationContainer>
    </PaperProvider>
  );
}

export default withExpoSnack(App);
