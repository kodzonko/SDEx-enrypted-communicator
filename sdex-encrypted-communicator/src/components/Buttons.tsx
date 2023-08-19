import * as React from "react";
import { AlertButton } from "react-native";
import { Button } from "react-native-paper";
import { BUTTON_ACCEPT_TEXT } from "../Messages";

export const GENERIC_OKAY_DISMISS_ALERT_BUTTON: AlertButton = {
  text: BUTTON_ACCEPT_TEXT,
  isPreferred: true,
  style: "default",
};

export function GENERIC_OKAY_DISMISS_BUTTON({ dismissFunc }: { dismissFunc: () => unknown }) {
  return (
    <Button mode="contained" className="mt-6 w-40" onPress={dismissFunc}>
      {BUTTON_ACCEPT_TEXT}
    </Button>
  );
}

export function GENERIC_SAVE_BUTTON({ saveFunc }: { saveFunc: () => unknown }) {
  return (
    <Button mode="contained" onPress={saveFunc} className="mt-6 w-40">
      Zachowaj
    </Button>
  );
}
