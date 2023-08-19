import * as DocumentPicker from "expo-document-picker";
import * as React from "react";
import { Alert } from "react-native";
import { Button, Dialog, Portal } from "react-native-paper";
import { useKeyPairStore } from "../contexts/KeyPair";
import { generateKeyPair } from "../crypto/RsaCrypto";
import logger from "../Logger";
import { readFile } from "../storage/FileOps";
import { GENERIC_OKAY_DISMISS_ALERT_BUTTON } from "./Buttons";

export default function RsaKeysCreatorDialog({
  visible,
  hideFunc,
}: {
  visible: boolean;
  hideFunc: () => void;
}) {
  const publicKey = useKeyPairStore((state) => state.publicKey);
  const privateKey = useKeyPairStore((state) => state.privateKey);
  const setPublicKey = useKeyPairStore((state) => state.setPublicKey);
  const setPrivateKey = useKeyPairStore((state) => state.setPrivateKey);

  const handleKeysGen = (): void => {
    logger.info("Generating key pair.");
    hideFunc();
    // eslint-disable-next-line no-void
    void generateKeyPair().then((result) => {
      setPublicKey(result.publicKey);
      setPrivateKey(result.privateKey);
    });
  };

  const handleKeysImport = async () => {
    try {
      logger.info("Picking a file with public key..");
      const documentPublic = await DocumentPicker.getDocumentAsync({
        type: "text/plain",
      });
      if (documentPublic.type === "success") {
        logger.info("Reading public key from a file.");
        const publicKeyImported = await readFile(documentPublic.uri);
        if (publicKeyImported) {
          setPublicKey(publicKeyImported);
        }
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
        const privateKeyImported = await readFile(documentPrivate.uri);
        if (privateKeyImported) {
          setPrivateKey(privateKeyImported);
        }

        logger.info("Private key read from file and assigned.");
      } else {
        logger.info("Private key file picking cancelled.");
      }
      if (publicKey === "" || privateKey === "") {
        logger.error("Failed to read key(s) from a file.");
        Alert.alert("Błąd odczytu", "Nie udało się wczytać kluczy z plików.", [
          GENERIC_OKAY_DISMISS_ALERT_BUTTON,
        ]);
      } else {
        logger.info("Public and private key read successfully. Closing dialog.");
      }
      hideFunc();
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    } catch (error: any) {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions */
      logger.error(`Failed to read key(s) from a file. ${error.message}`);
      Alert.alert("Błąd odczytu", "Nie udało się wczytać kluczy z plików.", [
        GENERIC_OKAY_DISMISS_ALERT_BUTTON,
      ]);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={hideFunc}>
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
  );
}
