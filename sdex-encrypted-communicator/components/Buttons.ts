import { AlertButton } from "react-native";
import { BUTTON_ACCEPT_TEXT } from "./Messages";

export const GENERIC_OKAY_DISMISS_BUTTON: AlertButton = {
  text: BUTTON_ACCEPT_TEXT,
  onPress: () => {},
  isPreferred: true,
};
