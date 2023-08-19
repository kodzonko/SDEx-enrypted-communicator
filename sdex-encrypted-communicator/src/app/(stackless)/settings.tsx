import { useRouter } from "expo-router";
import * as React from "react";
import { FlatList, SafeAreaView, StyleProp, ViewStyle } from "react-native";
import { Appbar, Dialog, Divider, List, Portal, Text } from "react-native-paper";
import { GENERIC_OKAY_DISMISS_BUTTON } from "../../components/Buttons";
import QrCodeDialog from "../../components/QrCodeDialog";
import { useAuthStore } from "../../contexts/Auth";
import { useKeyPairStore } from "../../contexts/KeyPair";
import styles from "../../Styles";

export default function Settings() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);
  const [qrDialogVisible, setQrDialogVisible] = React.useState(false);
  const [aboutAppDialogVisible, setAboutAppDialogVisible] = React.useState(false);
  const publicKey = useKeyPairStore((state) => state.publicKey);
  const setPublicKey = useKeyPairStore((state) => state.setPublicKey);
  const setPrivateKey = useKeyPairStore((state) => state.setPrivateKey);

  const showQrDialog = () => {
    setQrDialogVisible(true);
  };
  const hideQrDialog = () => {
    setQrDialogVisible(false);
  };
  const showAboutAppDialog = () => {
    setAboutAppDialogVisible(true);
  };
  const hideAboutAppDialog = () => {
    setAboutAppDialogVisible(false);
  };
  const handleSignOut = (): void => {
    // Before signing out, we need to clear the key pair from the store (it's still preserved in encrypted MMKV storage).
    setPublicKey("");
    setPrivateKey("");
    signOut();
  };

  const settingsItems = [
    { key: "0", title: "Wyloguj", func: handleSignOut },
    { key: "1", title: "Pokaż QR", func: showQrDialog },
    { key: "2", title: "O aplikacji", func: showAboutAppDialog },
  ];

  const divider = () => <Divider />;
  const rightIcon = (props: { color: string; style?: StyleProp<ViewStyle> }) => (
    /* eslint-disable-next-line react/jsx-props-no-spreading */
    <List.Icon {...props} icon="menu-right" />
  );

  return (
    <SafeAreaView>
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content title="Ustawienia" titleStyle={styles.appBarTitle} />
        <Appbar.BackAction onPress={router.back} iconColor={styles.appBarIcons.color} />
      </Appbar.Header>

      {publicKey && (
        <QrCodeDialog visible={qrDialogVisible} hideFunc={hideQrDialog} content={publicKey} />
      )}

      <Portal>
        <Dialog visible={aboutAppDialogVisible} onDismiss={hideAboutAppDialog}>
          <Dialog.Title style={{ textAlign: "center" }}>O aplikacji</Dialog.Title>
          <Dialog.Content className="flex items-center">
            <Text className="text-base">
              SDEx Communicator to aplikacja do bezpiecznej, szyfrowanej komunikacji na urządzeniach
              iOS i Android. Aplikacja umożliwia szyfrowaną wymianę wiadomości oraz plików pomiędzy
              użytkownikami, a także zarządzanie kluczami szyfrującymi.{"\n"}
              {"\n"}
              Program używa algorytmu szyfrowania SDEx z funkcją skrótu BLAKE3. Klucze szyfrujące są
              tworzone algorytmem RSA. A wymiana wiadomości odbywa się za pomocą protokołu TLS 1.3
              {"\n"}
              {"\n"}
              Wiadomości i dane kontaktowe są przechowywane wyłącznie na urządzeniu użytkownika.
              Użytkownik jest jedynym powiernikiem swoich danych, nie ma możliwości ich
              odszyfrowania w przypadku utraty PINu.{"\n"}
              {"\n"}
              Aplikacja została stworzona w ramach pracy inżynierskiej na Politechnice Łódzkiej.
            </Text>
            <GENERIC_OKAY_DISMISS_BUTTON dismissFunc={hideAboutAppDialog} />
          </Dialog.Content>
        </Dialog>
      </Portal>

      <FlatList
        className="mt-2"
        data={settingsItems}
        keyExtractor={(item) => item.key}
        ItemSeparatorComponent={divider}
        renderItem={({ item }) => (
          <List.Item
            title={item.title}
            right={rightIcon}
            titleNumberOfLines={1}
            onPress={item.func}
          />
        )}
      />
    </SafeAreaView>
  );
}
