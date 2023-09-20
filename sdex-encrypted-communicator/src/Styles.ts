import { StyleSheet } from "react-native";
import { MD3LightTheme as LightPaperTheme } from "react-native-paper";

const lightColorScheme = {
  primary: "rgb(0, 95, 175)",
  onPrimary: "rgb(255, 255, 255)",
  primaryContainer: "rgb(212, 227, 255)",
  onPrimaryContainer: "rgb(0, 28, 58)",
  secondary: "rgb(84, 95, 113)",
  onSecondary: "rgb(255, 255, 255)",
  secondaryContainer: "rgb(216, 227, 248)",
  onSecondaryContainer: "rgb(17, 28, 43)",
  tertiary: "rgb(0, 104, 116)",
  onTertiary: "rgb(255, 255, 255)",
  tertiaryContainer: "rgb(151, 240, 255)",
  onTertiaryContainer: "rgb(0, 31, 36)",
  error: "rgb(186, 26, 26)",
  onError: "rgb(255, 255, 255)",
  errorContainer: "rgb(255, 218, 214)",
  onErrorContainer: "rgb(65, 0, 2)",
  background: "rgb(253, 252, 255)",
  onBackground: "rgb(26, 28, 30)",
  surface: "rgb(253, 252, 255)",
  onSurface: "rgb(26, 28, 30)",
  surfaceVariant: "rgb(224, 226, 236)",
  onSurfaceVariant: "rgb(67, 71, 78)",
  outline: "rgb(116, 119, 127)",
  outlineVariant: "rgb(195, 198, 207)",
  shadow: "rgb(0, 0, 0)",
  scrim: "rgb(0, 0, 0)",
  inverseSurface: "rgb(47, 48, 51)",
  inverseOnSurface: "rgb(241, 240, 244)",
  inversePrimary: "rgb(165, 200, 255)",
  elevation: {
    level0: "transparent",
    level1: "rgb(240, 244, 251)",
    level2: "rgb(233, 239, 249)",
    level3: "rgb(225, 235, 246)",
    level4: "rgb(223, 233, 245)",
    level5: "rgb(218, 230, 244)",
  },
  surfaceDisabled: "rgba(26, 28, 30, 0.12)",
  onSurfaceDisabled: "rgba(26, 28, 30, 0.38)",
  backdrop: "rgba(45, 49, 56, 0.4)",
};
export const theme = {
  ...LightPaperTheme,
  colors: lightColorScheme,
};

const styles = StyleSheet.create({
  appBarHeader: {
    height: 80,
    backgroundColor: theme.colors.primary,
  },
  appBarTitle: {
    color: theme.colors.onPrimary,
    fontWeight: "700",
    fontSize: 30,
    lineHeight: 36,
  },
  appBarIcons: {
    color: theme.colors.onPrimary,
  },
  textInput: {
    width: 200,
  },
  surface: {
    marginLeft: 30,
    marginRight: 30,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderStartStartRadius: "0.5rem" /* 8px */,
    borderEndStartRadius: "0.5rem" /* 8px */,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 30,
  },
  blurView: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  barcodeTextURL: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
  },
  cameraOuterContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
  cameraInnerContainer: {
    width: "80%",
    aspectRatio: 0.75,
    overflow: "hidden",
    borderRadius: 30,
    marginBottom: 40,
  },
  cameraScanner: {
    flex: 1,
  },
});

export default styles;
