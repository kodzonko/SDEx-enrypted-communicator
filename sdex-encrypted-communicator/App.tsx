import { Asset } from "expo-asset";
import { withExpoSnack } from "nativewind";
import * as React from "react";
import "setimmediate";

function App() {
  // const isSignedIn = useAuthStore((state) => state.isSignedIn);
  const isSignedIn = true;
  const [items, setItems] = React.useState(null);
  React.useEffect(() => {
    (async () => {
      const sqlTemplateAsset = (await Asset.loadAsync(require("./assets/SqlDbTemplate.db")))[0];
      // await FileSystem.deleteAsync(FileSystem.documentDirectory + "SQLite/SqlDbTemplate.db");
      // console.log("exists: " + (await FileSystem.getInfoAsync(sqlTemplateAsset.localUri)).uri);
    })();
  }, []);

  // return (
  //   <PaperProvider theme={theme}>
  //     {isSignedIn ? (
  //       <AuthenticatedBottomTabNavigator theme={theme} />
  //     ) : (
  //       <UnauthenticatedStackNavigator theme={theme} />
  //     )}
  //   </PaperProvider>
  // );
}

export default withExpoSnack(App);
