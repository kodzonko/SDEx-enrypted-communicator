import { Link } from "expo-router";
import * as React from "react";
import { Alert, KeyboardAvoidingView, SafeAreaView, ScrollView } from "react-native";
import { Appbar, Button, Surface, Text, TextInput } from "react-native-paper";
import socket from "../../communication/sockets";
import { GENERIC_OKAY_DISMISS_ALERT_BUTTON } from "../../components/Buttons";
import QrCodeDialog from "../../components/QrCodeDialog";
import RsaKeysCreatorDialog from "../../components/RsaKeysCreatorDialog";
import { useAuthStore } from "../../contexts/Auth";
import { useSqlDbSessionStore } from "../../contexts/DbSession";
import { useKeyPairStore } from "../../contexts/KeyPair";
import { useServerStore } from "../../contexts/Server";
import logger from "../../Logger";
import { GENERIC_WRITE_ERROR_TITLE } from "../../Messages";
import { addContact } from "../../storage/DataHandlers";
import { mmkvStorage } from "../../storage/MmkvStorageMiddlewares";
import * as SecureStoreMiddleware from "../../storage/SecureStoreMiddlewares";
import { createDb } from "../../storage/SqlStorageMiddlewares";
import styles from "../../Styles";
import { Contact } from "../../Types";

export default function SignUp(): Element {
  const [userPin, setUserPin] = React.useState<string>("");
  const [userPinRepeated, setUserPinRepeated] = React.useState<string>("");
  const [keyObtainDialogVisible, setKeyObtainDialogVisible] = React.useState(false);
  const [qrExportDialogVisible, setQrExportDialogVisible] = React.useState(false);
  const signIn = useAuthStore((state) => state.signIn);
  const publicKey = useKeyPairStore((state) => state.publicKey);
  const privateKey = useKeyPairStore((state) => state.privateKey);
  const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);
  const setSqlDbSession = useSqlDbSessionStore((state) => state.setSqlDbSession);
  const setUnregistered = useServerStore((state) => state.setUnregistered);

  const handleSignUp = async () => {
    // Clear registered flag. Once registered button is pressed, previous registration data (is present) is no longer valid.
    setUnregistered();
    // Store RSA key pair in MMKV storage
    mmkvStorage.set("privateKey", privateKey);
    mmkvStorage.set("publicKey", publicKey);
    // Store PIN in SecureStore
    const successfulPinWrite = await SecureStoreMiddleware.saveSecure("userPIN", userPin);
    if (!successfulPinWrite) {
      logger.error("Failed to save PIN to SecureStore.");
      Alert.alert(GENERIC_WRITE_ERROR_TITLE, "Nie udało się zapisać PINu w bazie danych.", [
        GENERIC_OKAY_DISMISS_ALERT_BUTTON,
      ]);
      return;
    }
    logger.info("PIN and key pair saved successfully.");
    // Creating fresh sql db file from template. Creating a new session.
    logger.info("SignUp successful. Creating a new app database.");
    await createDb()
      .then(() => {
        setSqlDbSession();
      })
      .catch((error) => {
        logger.error(`Failed to create a new app database: ${JSON.stringify(error)}`);
        Alert.alert(GENERIC_WRITE_ERROR_TITLE, "Nie udało się utworzyć nowej bazy danych.", [
          GENERIC_OKAY_DISMISS_ALERT_BUTTON,
        ]);
      });
    // Adding your contact to the database
    const yourContact = new Contact("Twój profil", "", publicKey, 0);
    logger.info(`contact: ${JSON.stringify(yourContact)}`);
    addContact(yourContact, sqlDbSession)
      .then(() => {
        logger.info("Your contact has been added to the database.");
        logger.info("Registering client on the server...");
        socket.emit("registerInit");
        logger.info("Signing in...");
        // Signing in to the app
        signIn();
      })
      .catch((error) => {
        if (error instanceof Error) {
          logger.error(
            `An error occurred when trying to save user's contact to database=${JSON.stringify(
              error,
            )}`,
          );
          Alert.alert(GENERIC_WRITE_ERROR_TITLE, "Nie udało się zapisać twojego kontaktu.", [
            GENERIC_OKAY_DISMISS_ALERT_BUTTON,
          ]);
        }
      });
  };

  const showKeyObtainDialog = () => setKeyObtainDialogVisible(true);

  const hideKeyObtainDialog = () => {
    setKeyObtainDialogVisible(false);
  };

  const showQrExportDialog = () => setQrExportDialogVisible(true);

  const hideQrExportDialog = () => {
    setQrExportDialogVisible(false);
  };

  return (
    <SafeAreaView className="flex flex-1 flex-col">
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content title="Rejestracja" titleStyle={styles.appBarTitle} />
        <Link href="/sign-in" asChild>
          <Appbar.BackAction iconColor={styles.appBarIcons.color} />
        </Link>
      </Appbar.Header>

      <RsaKeysCreatorDialog visible={keyObtainDialogVisible} hideFunc={hideKeyObtainDialog} />

      <QrCodeDialog
        visible={qrExportDialogVisible}
        hideFunc={hideQrExportDialog}
        content={publicKey}
      />

      <ScrollView keyboardShouldPersistTaps="never">
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
          <Button mode="contained" onPress={showKeyObtainDialog} className="mx-2 mb-6 w-40">
            Uzyskaj
          </Button>
          <Text variant="bodyLarge" className="mt-2">
            Klucz prywatny: {privateKey ? "\u2714" : "\u274C"}
          </Text>
          <Text variant="bodyLarge" className="mt-2">
            Klucz publiczny: {publicKey ? "\u2714" : "\u274C"}
          </Text>
          <Button
            mode="contained"
            onPress={showQrExportDialog}
            className="mx-2 mt-6 w-40"
            disabled={!publicKey}
          >
            Wygeneruj QR
          </Button>
        </Surface>
        <KeyboardAvoidingView className="mb-2 mt-auto">
          <Button
            mode="contained"
            className="mx-auto mb-3 mt-5 w-40"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress={handleSignUp}
            disabled={
              !privateKey || !publicKey || userPin.length < 4 || userPin !== userPinRepeated
            }
          >
            Zarejestruj
          </Button>
          <Link href="/sign-in" asChild>
            <Button mode="text">Masz już konto? Zaloguj się</Button>
          </Link>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}
