import { useRouter } from "expo-router";
import * as React from "react";
import { SafeAreaView } from "react-native";
import { Appbar, Text } from "react-native-paper";
import styles from "../../Styles";

export default function Settings() {
  const router = useRouter();
  return (
    <SafeAreaView>
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content title="Ustawienia" titleStyle={styles.appBarTitle} />
        <Appbar.BackAction onPress={router.back} iconColor={styles.appBarIcons.color} />
      </Appbar.Header>
      <Text>Settings Screen</Text>
    </SafeAreaView>
  );
}
