import { withExpoSnack } from "nativewind";
import * as React from "react";
import {
  adaptNavigationTheme,
  MD3LightTheme as DefaultTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import MainStackNavigator from "./components/navigation/MainStackNavigator";

// UI theme
const theme = {
  ...DefaultTheme,
  colors: {
    primary: "rgb(0, 106, 106)",
    onPrimary: "rgb(255, 255, 255)",
    primaryContainer: "rgb(111, 247, 246)",
    onPrimaryContainer: "rgb(0, 32, 32)",
    secondary: "rgb(74, 99, 99)",
    onSecondary: "rgb(255, 255, 255)",
    secondaryContainer: "rgb(204, 232, 231)",
    onSecondaryContainer: "rgb(5, 31, 31)",
    tertiary: "rgb(75, 96, 124)",
    onTertiary: "rgb(255, 255, 255)",
    tertiaryContainer: "rgb(211, 228, 255)",
    onTertiaryContainer: "rgb(4, 28, 53)",
    error: "rgb(186, 26, 26)",
    onError: "rgb(255, 255, 255)",
    errorContainer: "rgb(255, 218, 214)",
    onErrorContainer: "rgb(65, 0, 2)",
    background: "rgb(250, 253, 252)",
    onBackground: "rgb(25, 28, 28)",
    surface: "rgb(250, 253, 252)",
    onSurface: "rgb(25, 28, 28)",
    surfaceVariant: "rgb(218, 229, 228)",
    onSurfaceVariant: "rgb(63, 73, 72)",
    outline: "rgb(111, 121, 121)",
    outlineVariant: "rgb(190, 201, 200)",
    shadow: "rgb(0, 0, 0)",
    scrim: "rgb(0, 0, 0)",
    inverseSurface: "rgb(45, 49, 49)",
    inverseOnSurface: "rgb(239, 241, 240)",
    inversePrimary: "rgb(76, 218, 218)",
    elevation: {
      level0: "transparent",
      level1: "rgb(238, 246, 245)",
      level2: "rgb(230, 241, 240)",
      level3: "rgb(223, 237, 236)",
      level4: "rgb(220, 235, 235)",
      level5: "rgb(215, 232, 232)",
    },
    surfaceDisabled: "rgba(25, 28, 28, 0.12)",
    onSurfaceDisabled: "rgba(25, 28, 28, 0.38)",
    backdrop: "rgba(41, 50, 50, 0.4)",
  },
};

const { LightTheme } = adaptNavigationTheme({ reactNavigationLight: DefaultTheme });

function App() {
  return (
    <PaperProvider theme={theme}>
      <MainStackNavigator theme={LightTheme} />
    </PaperProvider>
  );
}

export default withExpoSnack(App);
