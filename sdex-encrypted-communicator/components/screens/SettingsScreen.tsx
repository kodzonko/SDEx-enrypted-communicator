import * as React from "react";
import { SafeAreaView } from "react-native";
import { Appbar, Text } from "react-native-paper";
import styles from "../Styles";
import { SettingsScreenPropsType } from "../Types";

function SettingsScreen({ navigation }: SettingsScreenPropsType) {
  return (
    <SafeAreaView>
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content title="Ustawienia" titleStyle={styles.appBarTitle} />
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          iconColor={styles.appBarIcons.color}
        />
      </Appbar.Header>
      <Text>Settings Screen</Text>
    </SafeAreaView>
  );
}

export default SettingsScreen;
