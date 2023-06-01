import * as React from "react";
import { SafeAreaView } from "react-native";
import { Appbar, Text } from "react-native-paper";
import { SettingsScreenPropsType } from "../Types";

function SettingsScreen({ navigation }: SettingsScreenPropsType) {
  const _goBack = () => navigation.goBack();

  return (
    <SafeAreaView>
      <Appbar.Header>
        <Appbar.BackAction onPress={_goBack} />
        <Appbar.Content title="Ustawienia" />
      </Appbar.Header>
      <Text>Settings Screen</Text>
    </SafeAreaView>
  );
}

export default SettingsScreen;
