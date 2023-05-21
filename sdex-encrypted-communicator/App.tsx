
import { Provider as PaperProvider } from "react-native-paper";
import "setimmediate";
import MainStackNavigator from "./components/navigation/MainStackNavigator";
import { theme } from "./Styles";

function App() {
  return (
    <PaperProvider theme={theme}>
      <MainStackNavigator theme={theme} />
    </PaperProvider>
  );
}

export default withExpoSnack(App);
