import * as DocumentPicker from "expo-document-picker";
import * as React from "react";
import { KeyboardAvoidingView, SafeAreaView } from "react-native";
import {
  Appbar,
  Button,
  Dialog,
  Portal,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import { shallow } from "zustand/shallow";
import { generateKeyPair } from "../crypto/RsaCrypto";
import { readFile } from "../storage/FileOps";
import styles from "../Styles";

import { useKeysStore } from "../Contexts";
import { BUTTON_ACCEPT_TEXT } from "../Messages";
import { SignUpScreenPropsType } from "../Types";

function SignUpScreen({ navigation }: SignUpScreenPropsType) {
  const [userPIN, setUserPIN] = React.useState("");
  const [userPINRepeated, setUserPINRepeated] = React.useState("");
  const { publicKey, updatePublicKey, privateKey, updatePrivateKey } = useKeysStore(
    (state) => ({
      publicKey: state.publicKey,
      updatePublicKey: state.updatePublicKey,
      privateKey: state.privateKey,
      updatePrivateKey: state.updatePrivateKey,
    }),
    shallow,
  );
  const [keyObtainDialogVisible, setKeyObtainDialogVisible] = React.useState(false);
  const _goBack = () => navigation.goBack();

  const handleSignUp = () => {};

  const handleKeysGen = () => {
    const generatedKeyPair = generateKeyPair();
    updatePublicKey(generatedKeyPair.publicKey);
    updatePrivateKey(generatedKeyPair.privateKey);
  };
  const handleKeysImport = async () => {
    try {
      const resultPublic = await DocumentPicker.getDocumentAsync({
        type: "text/plain",
      });
      if (resultPublic.type === "success") {
        readFile(resultPublic.uri)
          .then((value) => {
            updatePublicKey(value);
          })
          .catch((error) => {});
      }
      const resultPrivate = await DocumentPicker.getDocumentAsync({
        type: "text/plain",
      });
      if (resultPrivate.type === "success") {
        readFile(resultPrivate.uri)
          .then((value) => {
            updatePrivateKey(value);
          })
          .catch((error) => {});
      }
    } catch (error) {}
  };

  const showKeyObtainDialog = () => setKeyObtainDialogVisible(true);

  const hideKeyObtainDialog = () => setKeyObtainDialogVisible(false);

  return (
    <SafeAreaView className="flex flex-1 flex-col">
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.BackAction onPress={_goBack} iconColor={styles.appBarIcons.color} />
        <Appbar.Content title="Rejestracja" titleStyle={styles.appBarTitle} />
      </Appbar.Header>

      <Portal>
        <Dialog visible={keyObtainDialogVisible} onDismiss={hideKeyObtainDialog}>
          <Dialog.Title style={{ textAlign: "center" }}>Dodaj klucze</Dialog.Title>
          <Dialog.Content className="flex flex-1 flex-col items-center justify-center">
            <Button mode="contained" onPress={handleKeysGen} className="mx-2 mb-6 w-40">
              Wygeneruj
            </Button>
            <Button
              mode="contained"
              onPress={handleKeysImport}
              className="mx-2 mb-6 w-40"
            >
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
          value={userPIN}
          onChangeText={(value) => setUserPIN(value)}
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
          value={userPINRepeated}
          onChangeText={(value) => setUserPINRepeated(value)}
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
          disabled={privateKey.length > 0 && publicKey.length > 0}
        >
          Uzyskaj
        </Button>
        <Text variant="bodyLarge" className="mt-4">
          Klucz prywatny: {privateKey ? "\u2714" : "\u274C"}
        </Text>
        <Text variant="bodyLarge" className="mt-2">
          Klucz publiczny: {publicKey ? "\u2714" : "\u274C"}
        </Text>
      </Surface>
      <Button
        mode="contained"
        className="mx-auto mt-5 w-40"
        onPress={handleSignUp}
        disabled={
          !privateKey || !publicKey || userPIN.length < 4 || userPIN !== userPINRepeated
        }
      >
        Zarejestruj
      </Button>
      <KeyboardAvoidingView className="mb-2 mt-auto">
        <Button mode="text" onPress={() => navigation.navigate("Login")}>
          Masz już konto? Zaloguj się
        </Button>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default SignUpScreen;
