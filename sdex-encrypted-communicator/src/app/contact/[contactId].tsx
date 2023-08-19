import * as React from "react";
import { Alert, SafeAreaView, View } from "react-native";

import { Appbar, Button, Text, TextInput } from "react-native-paper";

import { Link, useLocalSearchParams, useRouter } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import { GENERIC_OKAY_DISMISS_ALERT_BUTTON } from "../../components/Buttons";
import { useSqlDbSessionStore } from "../../contexts/DbSession";
import logger from "../../Logger";
import {
  addContact,
  getContactById,
  selectRsaKeyFile,
  updateContact,
} from "../../storage/DataHandlers";
import styles from "../../Styles";
import { Contact } from "../../Types";

export default function ContactView() {
  const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);
  const [contact, setContact] = React.useState<Contact | undefined>(undefined);
  const [updateMode, setUpdateMode] = React.useState<boolean>(false);
  const [contactBuilder, setContactBuilder] = React.useState({
    name: "",
    surname: "",
    publicKey: "",
    messagingKey: "",
  });

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
        messagingKey: contact.messagingKey,
      });
      setUpdateMode(true);
    }
  }, [contact]);

  const verifyContactBuilder = (): boolean => {
    if (
      typeof contactBuilder.name !== "string" ||
      typeof contactBuilder.surname !== "string" ||
      typeof contactBuilder.publicKey !== "string" ||
      typeof contactBuilder.messagingKey !== "string"
    ) {
      logger.error("Contact builder verification unsuccessful. Some fields are not strings.");
      return false;
    }
    if (
      contactBuilder.name.length < 1 ||
      contactBuilder.surname.length < 1 ||
      contactBuilder.publicKey.length < 1 ||
      contactBuilder.messagingKey.length < 1
    ) {
      logger.error("Contact builder verification unsuccessful. Some fields are empty strings.");
      return false;
    }
    if (
      !contactBuilder.publicKey.startsWith("-----BEGIN PUBLIC KEY-----") ||
      !contactBuilder.publicKey.endsWith("-----END PUBLIC KEY-----")
    ) {
      logger.error(
        "Contact builder verification unsuccessful. publicKey field is not a valid RSA public key.",
      );
      return false;
    }
    logger.info("Contact builder verification successful.");
    return true;
  };

  const handleContactSave = async (): Promise<void> => {
    logger.info('Handling contact save from "contacts/[contactId]" route.');
    if (verifyContactBuilder()) {
      const contactFromBuilder: Contact = new Contact(
        contactBuilder.name,
        contactBuilder.surname,
        contactBuilder.publicKey,
        contactBuilder.messagingKey,
      );
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
      } else {
        logger.info("Contact saved to database successfully.");
      }
    }
    // verification failed
    Alert.alert(
      "Błąd",
      "Nie zapisano kontaktu. Sprawdź poprawność danych.",
      [GENERIC_OKAY_DISMISS_ALERT_BUTTON],
      { cancelable: true },
    );
  };

  const handleImportRsaKey = async (): Promise<void> => {
    logger.info('Handling RSA key import from "contacts/[contactId]" route.');
    const rsaKey = await selectRsaKeyFile();
    if (!rsaKey) {
      logger.warn("No RSA key file selected.");
      return;
    }
    logger.info("Selected RSA key file.");
    contactBuilder.publicKey = rsaKey;
  };

  return (
    <SafeAreaView className="flex-1">
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content
          title={updateMode ? "Edytowanie kontaktu" : "Dodawanie kontaktu"}
          titleStyle={styles.appBarTitle}
        />
        <Link href="/contacts" asChild>
          <Appbar.BackAction iconColor={styles.appBarIcons.color} />
        </Link>
      </Appbar.Header>
      <View className="mx-8">
        <Text variant="titleLarge" className="mt-4">
          Imię
        </Text>
        <TextInput
          className="mt-2"
          mode="outlined"
          // style={styles.textInputPin}
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
          // style={styles.textInputPin}
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
            className="mr-6 basis-10/12"
            // style={styles.textInputPin}
            defaultValue={contactBuilder.publicKey}
            value={contactBuilder.publicKey}
            onChangeText={(value) => {
              setContactBuilder({ ...contactBuilder, publicKey: value });
            }}
          />
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <Icon name="folder-open-outline" size={40} onPress={handleImportRsaKey} />
        </View>
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <Button mode="contained" className="mx-auto my-7 w-40" onPress={handleContactSave}>
          Zapisz
        </Button>
      </View>
    </SafeAreaView>
  );
}
