import * as React from "react";
import { Alert, SafeAreaView, View } from "react-native";

import { Appbar, Button, Text, TextInput } from "react-native-paper";

import { Link, useLocalSearchParams, useRouter } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import { GENERIC_OKAY_DISMISS_ALERT_BUTTON } from "../../components/Buttons";
import { useSqlDbSessionStore } from "../../contexts/DbSession";
import { useQrScannedStore } from "../../contexts/QrScannedData";
import logger from "../../Logger";
import {
  addContact,
  getContactById,
  removeContact,
  selectRsaKeyFile,
  updateContact,
} from "../../storage/DataHandlers";
import styles, { theme } from "../../Styles";
import { Contact } from "../../Types";

export default function ContactView() {
  const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);
  const [contact, setContact] = React.useState<Contact | undefined>(undefined);
  const [updateMode, setUpdateMode] = React.useState<boolean>(false);
  const [contactBuilder, setContactBuilder] = React.useState({
    name: "",
    surname: "",
    publicKey: "",
  });

  const publicKey = useQrScannedStore((state) => state.publicKey);
  const setPublicKey = useQrScannedStore((state) => state.setPublicKey);

  const params = useLocalSearchParams();
  const { contactId } = params;
  const router = useRouter();

  React.useEffect(() => {
    (async () => {
      // If contactID is -1, then user is creating a new contact (so we don't look for it in database).
      if (contactId && contactId !== "-1") {
        logger.info(`Fetching contact info for contactId=${JSON.stringify(contactId)}.`);
        const dbQueryResult = await getContactById(Number(contactId), sqlDbSession);
        if (!dbQueryResult) {
          logger.error(`User with contactId=${JSON.stringify(contactId)} not found in storage.`);
        } else {
          setContact(dbQueryResult);
        }
      } else {
        logger.info(`Creating new contact.`);
      }
    })();
  }, [contactId]);

  React.useEffect(() => {
    if (contact) {
      logger.info(
        "Pulled contact data from db successfully. Filling forms with contact data and going into update mode.",
      );
      setContactBuilder({
        name: contact.name,
        surname: contact.surname,
        publicKey: contact.publicKey,
      });
      setUpdateMode(true);
    }
  }, [contact]);

  React.useEffect(() => {
    if (publicKey) {
      logger.info("Updating form with scanned RSA key.");
      setContactBuilder({
        ...contactBuilder,
        publicKey,
      });
    }
  }, [publicKey]);

  const verifyContactBuilder = (): boolean => {
    if (
      typeof contactBuilder.name !== "string" ||
      typeof contactBuilder.surname !== "string" ||
      typeof contactBuilder.publicKey !== "string"
    ) {
      logger.error("Contact builder verification unsuccessful. Some fields are not strings.");
      return false;
    }
    if (
      (contactBuilder.name.length < 1 && contactBuilder.surname.length < 1) ||
      contactBuilder.publicKey.length < 1
    ) {
      logger.error("Contact builder verification unsuccessful. Some fields are empty strings.");
      return false;
    }
    logger.info("Contact builder verification successful.");
    return true;
  };

  const handleContactSave = async (): Promise<void> => {
    logger.info("Handling contact save.");
    if (verifyContactBuilder()) {
      const contactFromBuilder: Contact = new Contact(
        contactBuilder.name,
        contactBuilder.surname,
        contactBuilder.publicKey,
        Number(contactId) === -1 ? undefined : Number(contactId),
      );
      setPublicKey("");
      let dbQueryResult = false;
      if (updateMode) {
        logger.info("Updating contact in database.");
        dbQueryResult = await updateContact(contactFromBuilder, sqlDbSession);
        router.back();
      } else {
        logger.info("Adding new contact to database.");
        dbQueryResult = await addContact(contactFromBuilder, sqlDbSession);
        router.back();
      }
      if (!dbQueryResult) {
        logger.error("Failed to save contact to database.");
        Alert.alert(
          "Błąd",
          "Nie udało się zapisać kontaktu. Błąd bazy danych.",
          [GENERIC_OKAY_DISMISS_ALERT_BUTTON],
          { cancelable: true },
        );
        return;
      }
      logger.info("Contact saved to database successfully.");
      return;
    }
    // verification failed
    Alert.alert(
      "Błąd",
      "Nie zapisano kontaktu. Sprawdź poprawność danych.",
      [GENERIC_OKAY_DISMISS_ALERT_BUTTON],
      { cancelable: true },
    );
  };

  const handleContactRemove = (): void => {
    logger.info("Handling contact remove.");
    if (contactId && contactId !== "-1") {
      Alert.alert(
        "Usuwanie kontaktu",
        "Czy na pewno chcesz usunąć kontakt?",
        [
          {
            text: "Tak",
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress: async () => {
              setPublicKey("");
              const dbQueryResult = await removeContact(Number(contactId), sqlDbSession);
              if (!dbQueryResult) {
                logger.error("Failed to remove contact from database.");
                Alert.alert(
                  "Błąd",
                  "Nie udało się usunąć kontaktu. Błąd bazy danych.",
                  [GENERIC_OKAY_DISMISS_ALERT_BUTTON],
                  { cancelable: true },
                );
                return;
              }
              logger.info("Contact removed from database successfully.");
              router.back();
            },
          },
          {
            text: "Nie",
            style: "cancel",
          },
        ],
        { cancelable: true },
      );
    }
  };

  const handleImportRsaKey = React.useCallback(async () => {
    logger.info("Handling RSA key import.");
    const rsaKey = await selectRsaKeyFile();
    if (!rsaKey) {
      logger.warn("No RSA key file selected.");
      return;
    }
    logger.info("Selected RSA key file.");
    setContactBuilder({ ...contactBuilder, publicKey: rsaKey });
  }, [selectRsaKeyFile]);

  return (
    <SafeAreaView className="grow">
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content
          title={updateMode ? "Edytowanie kontaktu" : "Dodawanie kontaktu"}
          titleStyle={styles.appBarTitle}
        />
        <Link href="/contacts" asChild>
          <Appbar.BackAction iconColor={styles.appBarIcons.color} />
        </Link>
      </Appbar.Header>
      <View className="mx-8 grow">
        <Text variant="titleLarge" className="mt-4">
          Imię
        </Text>
        <TextInput
          className="mt-2"
          mode="outlined"
          defaultValue={contactBuilder.name}
          value={contactBuilder.name}
          onChangeText={(value) => {
            setContactBuilder({ ...contactBuilder, name: value });
          }}
        />
        <Text variant="titleLarge" className="mt-4">
          Nazwisko
        </Text>
        <TextInput
          className="mt-2"
          mode="outlined"
          defaultValue={contactBuilder.surname}
          value={contactBuilder.surname}
          onChangeText={(value) => {
            setContactBuilder({ ...contactBuilder, surname: value });
          }}
        />
        <Text variant="titleLarge" className="mt-4">
          Klucz publiczny RSA
        </Text>
        <View className="mt-2 flex-row items-center">
          <TextInput
            mode="outlined"
            className="mr-5 basis-8/12"
            defaultValue={contactBuilder.publicKey}
            value={contactBuilder.publicKey}
            onChangeText={(value) => {
              setContactBuilder({ ...contactBuilder, publicKey: value });
            }}
          />
          <View className="mt-2 flex-row items-center space-x-3">
            {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
            <Icon name="folder-open-outline" size={40} onPress={handleImportRsaKey} />
            <Link href="/qrScanner" asChild>
              <Icon name="qr-code-outline" size={40} />
            </Link>
          </View>
        </View>
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <Button mode="contained" className="mx-auto my-7 w-40" onPress={handleContactSave}>
          Zapisz
        </Button>
        <View className="grow">
          {updateMode ? (
            <Button
              mode="contained"
              className="mb-5 mt-auto w-40 self-center"
              buttonColor={theme.colors.error}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onPress={handleContactRemove}
            >
              Usuń
            </Button>
          ) : (
            <Button
              mode="contained"
              className="mb-10 mt-auto w-40 self-center"
              buttonColor={theme.colors.error}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onPress={() => {
                setPublicKey("");
                router.back();
              }}
            >
              Anuluj
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
