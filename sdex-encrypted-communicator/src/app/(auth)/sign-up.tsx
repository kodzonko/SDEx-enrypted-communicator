import * as DocumentPicker from "expo-document-picker";
import { Link } from "expo-router";
import * as React from "react";
import { Alert, KeyboardAvoidingView, SafeAreaView, ScrollView, View } from "react-native";
import { Appbar, Button, Dialog, Portal, Surface, Text, TextInput } from "react-native-paper";
import QRCode from "react-native-qrcode-svg";
import Toast from "react-native-root-toast";
import { GENERIC_OKAY_DISMISS_BUTTON } from "../../components/Buttons";
import { useAuthStore } from "../../contexts/Auth";
import { generateKeyPair } from "../../crypto/RsaCrypto";
import logger from "../../Logger";
import { readFile, saveImage } from "../../storage/FileOps";
import { mmkvStorage } from "../../storage/MmkvStorageMiddlewares";
import * as SecureStoreMiddleware from "../../storage/SecureStoreMiddlewares";
import styles from "../../Styles";
import { KeyPair } from "../../Types";

export default function SignUp(): Element {
  const [userPin, setUserPin] = React.useState<string>("");
  const [userPinRepeated, setUserPinRepeated] = React.useState<string>("");
  const [keyPair, setKeyPair] = React.useState<KeyPair>({
    publicKey: "",
    privateKey: "",
  });
  const [keyObtainDialogVisible, setKeyObtainDialogVisible] = React.useState(false);
  const [qrExportDialogVisible, setQrExportDialogVisible] = React.useState(false);
  const signIn = useAuthStore((state) => state.signIn);
  const qrRef = React.createRef();

  const handleSignUp = async () => {
    mmkvStorage.set("privateKey", keyPair.privateKey);
    mmkvStorage.set("publicKey", keyPair.publicKey);
    const successfulPinWrite = await SecureStoreMiddleware.saveSecure("userPIN", userPin);
    if (!successfulPinWrite) {
      logger.error("Failed to save PIN to SecureStore.");
      Alert.alert("Błąd zapisu", "Nie udało się zapisać PINu w bazie danych.", [
        GENERIC_OKAY_DISMISS_BUTTON,
      ]);
    } else {
      logger.info("PIN and key pair saved successfully. Signing in...");
      signIn();
    }
  };

  const showKeyObtainDialog = () => setKeyObtainDialogVisible(true);

  const hideKeyObtainDialog = () => {
    setKeyObtainDialogVisible(false);
  };

  const showQrExportDialog = () => setQrExportDialogVisible(true);

  const hideQrExportDialog = () => {
    setQrExportDialogVisible(false);
  };

  const saveQrImg = async () => {
    logger.info("Saving QR code to a file.");
    const result = await saveImage("qr.png", qrRef.current as string);
    if (!result) {
      Alert.alert("Błąd zapisu", "Nie udało się zapisać QR kodu.", [GENERIC_OKAY_DISMISS_BUTTON]);
    } else {
      Toast.show("Kod QR został zapisany.", {
        duration: Toast.durations.SHORT,
      });
    }
  };

  const handleKeysGen = () => {
    logger.info("Generating key pair.");
    const generatedKeyPair = generateKeyPair(128);
    setKeyPair(generatedKeyPair);
    hideKeyObtainDialog();
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
      } else {
        logger.info("Public and private key read successfully. Closing dialog.");
      }
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
          <Dialog.Actions className="flex-col">
            <Button mode="contained" onPress={handleKeysGen} className="mx-2 mb-6 w-40">
              Wygeneruj
            </Button>
            {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
            <Button mode="contained" onPress={handleKeysImport} className="mx-2 mb-6 w-40">
              Wczytaj
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={qrExportDialogVisible} onDismiss={hideQrExportDialog}>
          <Dialog.Title style={{ textAlign: "center" }}>QR z kluczem publicznym</Dialog.Title>
          <Dialog.Content>
            <View className="items-center">
              <QRCode
                value={keyPair.publicKey}
                ecl="H"
                quietZone={10}
                getRef={(c): void => {
                  if (c) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    c.toDataURL((data: string) => {
                      qrRef.current = data.replace(/(\r\n|\n|\r)/gm, "");
                    });
                  }
                }}
              />
              <Button
                mode="contained"
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onPress={saveQrImg}
                className="mt-6 w-40"
                disabled={!keyPair.publicKey}
              >
                Zachowaj
              </Button>
            </View>
          </Dialog.Content>
        </Dialog>
      </Portal>
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
            Klucz prywatny: {keyPair.privateKey ? "\u2714" : "\u274C"}
          </Text>
          <Text variant="bodyLarge" className="mt-2">
            Klucz publiczny: {keyPair.publicKey ? "\u2714" : "\u274C"}
          </Text>
          <Button
            mode="contained"
            onPress={showQrExportDialog}
            className="mx-2 mt-6 w-40"
            disabled={!keyPair.publicKey}
          >
            Wygeneruj QR
          </Button>
        </Surface>
        <KeyboardAvoidingView className="mb-2 mt-auto">
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
          <Link href="/sign-in" asChild>
            <Button mode="text">Masz już konto? Zaloguj się</Button>
          </Link>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}
