import * as DocumentPicker from "expo-document-picker";
import { Link } from "expo-router";
import * as React from "react";
import { Alert, KeyboardAvoidingView, SafeAreaView } from "react-native";
import { Appbar, Button, Dialog, Portal, Surface, Text, TextInput } from "react-native-paper";
import { generateKeyPair } from "../../crypto/RsaCrypto";
import { readFile } from "../../storage/FileOps";
import styles from "../../Styles";

import { GENERIC_OKAY_DISMISS_BUTTON } from "../../components/Buttons";
import { useAuthStore } from "../../contexts/Auth";
import logger from "../../Logger";
import { BUTTON_ACCEPT_TEXT } from "../../Messages";
import { mmkvStorage } from "../../storage/MmkvStorageMiddlewares";
import * as SecureStoreMiddleware from "../../storage/SecureStoreMiddlewares";
import { KeyPair } from "../../Types";

export default function SignUp() {
  const [userPin, setUserPin] = React.useState<string>("");
  const [userPinRepeated, setUserPinRepeated] = React.useState<string>("");
  const [keyPair, setKeyPair] = React.useState<KeyPair>({
    publicKey: "",
    privateKey: "",
  });
  const [keyObtainDialogVisible, setKeyObtainDialogVisible] = React.useState(false);
  const signIn = useAuthStore((state) => state.signIn);

  const handleSignUp = async () => {
    const successfulKeyPairWrite = mmkvStorage.setMap("keyPair", keyPair);
    if (!successfulKeyPairWrite) {
      logger.error("Failed to save key pair to MMKV storage.");
      Alert.alert("Błąd zapisu", "Nie udało się zapisać kluczy w bazie danych.", [
        GENERIC_OKAY_DISMISS_BUTTON,
      ]);
    }
    const successfulPinWrite = await SecureStoreMiddleware.saveSecure("userPIN", userPin);
    if (!successfulPinWrite) {
      logger.error("Failed to save PIN to SecureStore.");
      Alert.alert("Błąd zapisu", "Nie udało się zapisać PINu w bazie danych.", [
        GENERIC_OKAY_DISMISS_BUTTON,
      ]);
    }
    if (successfulKeyPairWrite && successfulPinWrite) {
      logger.info("PIN and key pair saved successfully. Signing in...");
      signIn();
    }
  };

  const showKeyObtainDialog = () => setKeyObtainDialogVisible(true);

  const hideKeyObtainDialog = () => setKeyObtainDialogVisible(false);

  const handleKeysGen = () => {
    const generatedKeyPair = generateKeyPair();
    setKeyPair(generatedKeyPair);
  };
  const handleKeysImport = async () => {
    let publicKey = "";
    let privateKey = "";
    try {
      logger.info("Picking a file with public key..");
      const documentPublic = await DocumentPicker.getDocumentAsync({
        type: "text/plain",
      });
      if (documentPublic.type === "success") {
        logger.info("Reading public key from a file.");
        publicKey = (await readFile(documentPublic.uri)) ?? "";
        setKeyPair({
          ...keyPair,
          publicKey,
        });
        logger.info("Public key read from file and assigned.");
      } else {
        logger.info("Public key file picking cancelled.");
      }

      logger.info("Picking a file with private key..");
      const documentPrivate = await DocumentPicker.getDocumentAsync({
        type: "text/plain",
      });
      if (documentPrivate.type === "success") {
        logger.info("Reading private key from a file.");
        privateKey = (await readFile(documentPrivate.uri)) ?? "";
        setKeyPair({
          ...keyPair,
          privateKey,
        });
        logger.info("Private key read from file and assigned.");
      } else {
        logger.info("Private key file picking cancelled.");
      }
      if (keyPair.publicKey === "" || keyPair.privateKey === "") {
        logger.error("Failed to read key(s) from a file.");
        Alert.alert("Błąd odczytu", "Nie udało się wczytać kluczy z plików.", [
          GENERIC_OKAY_DISMISS_BUTTON,
        ]);
      }
      logger.info("Public and private key read successfully. Closing dialog.");
      hideKeyObtainDialog();
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    } catch (error: any) {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions */
      logger.error(`Failed to read key(s) from a file. ${error.message}`);
      Alert.alert("Błąd odczytu", "Nie udało się wczytać kluczy z plików.", [
        GENERIC_OKAY_DISMISS_BUTTON,
      ]);
    }
  };

  return (
    <SafeAreaView className="flex flex-1 flex-col">
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content title="Rejestracja" titleStyle={styles.appBarTitle} />
        <Link href="/sign-in" asChild>
          <Appbar.BackAction iconColor={styles.appBarIcons.color} />
        </Link>
      </Appbar.Header>

      <Portal>
        <Dialog visible={keyObtainDialogVisible} onDismiss={hideKeyObtainDialog}>
          <Dialog.Title style={{ textAlign: "center" }}>Dodaj klucze</Dialog.Title>
          <Dialog.Content className="flex flex-1 flex-col items-center justify-center">
            <Button mode="contained" onPress={handleKeysGen} className="mx-2 mb-6 w-40">
              Wygeneruj
            </Button>
            {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
            <Button mode="contained" onPress={handleKeysImport} className="mx-2 mb-6 w-40">
              Wczytaj
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideKeyObtainDialog}>{BUTTON_ACCEPT_TEXT}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Surface style={[styles.surface, { marginTop: 30 }]}>
        <Text variant="titleLarge" className="mb-4">
          PIN
        </Text>
        <TextInput
          keyboardType="numeric"
          mode="outlined"
          style={styles.textInputPin}
          secureTextEntry
          autoFocus={false}
          maxLength={8}
          placeholder="Utwórz PIN"
          value={userPin}
          onChangeText={(value) => setUserPin(value)}
        />
        <TextInput
          className="mt-3"
          mode="outlined"
          style={styles.textInputPin}
          keyboardType="numeric"
          secureTextEntry
          autoFocus={false}
          maxLength={8}
          placeholder="Powtórz PIN"
          value={userPinRepeated}
          onChangeText={(value) => setUserPinRepeated(value)}
        />
        <Text variant="bodyLarge" className="mt-2 text-red-600">
          4-8 cyfr
        </Text>
      </Surface>
      <Surface
        style={[
          styles.surface,
          {
            marginTop: 30,
            paddingBottom: 30,
          },
        ]}
      >
        <Text variant="titleLarge" className="my-4">
          Klucze szyfrujące
        </Text>
        <Button
          mode="contained"
          onPress={showKeyObtainDialog}
          className="mx-2 mb-6 w-40"
          disabled={keyPair.privateKey.length > 0 && keyPair.publicKey.length > 0}
        >
          Uzyskaj
        </Button>
        <Text variant="bodyLarge" className="mt-4">
          Klucz prywatny: {keyPair.privateKey ? "\u2714" : "\u274C"}
        </Text>
        <Text variant="bodyLarge" className="mt-2">
          Klucz publiczny: {keyPair.publicKey ? "\u2714" : "\u274C"}
        </Text>
      </Surface>
      <Button
        mode="contained"
        className="mx-auto mt-5 w-40"
        /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
        onPress={handleSignUp}
        disabled={
          !keyPair.privateKey ||
          !keyPair.publicKey ||
          userPin.length < 4 ||
          userPin !== userPinRepeated
        }
      >
        Zarejestruj
      </Button>
      <KeyboardAvoidingView className="mb-2 mt-auto">
        <Link href="/sign-in" asChild>
          <Button mode="text">Masz już konto? Zaloguj się</Button>
        </Link>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
