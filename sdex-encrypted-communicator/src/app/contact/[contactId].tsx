import * as React from "react";
import { Alert, SafeAreaView, View } from "react-native";

import { Appbar, Button, Text, TextInput } from "react-native-paper";

import { Link, useLocalSearchParams, useRouter } from "expo-router";
import Toast from "react-native-root-toast";
import Icon from "react-native-vector-icons/Ionicons";
import { updatePublicKey } from "../../communication/Sockets";
import { GENERIC_OKAY_DISMISS_ALERT_BUTTON } from "../../components/Buttons";
import { useSqlDbSessionStore } from "../../contexts/DbSession";
import { useQrScannedStore } from "../../contexts/QrScannedData";
import { generateKeyPair } from "../../crypto/RsaCrypto";
import { PreconditionError } from "../../Errors";
import logger from "../../Logger";
import {
    addContact,
    getContactById,
    removeContact,
    selectRsaKeyFile,
    updateContact,
} from "../../storage/DataHandlers";
import { mmkvStorage } from "../../storage/MmkvStorageMiddlewares";
import styles, { theme } from "../../Styles";
import { Contact } from "../../Types";

function LoginField() {
    return (
        <>
            <Text variant="titleLarge" className="mt-4">
                Login
            </Text>
            <TextInput
                className="mt-2"
                mode="outlined"
                defaultValue={mmkvStorage.getString("login")}
                disabled
            />
        </>
    );
}

function PrivateKeyField({
    inputValue,
    onChangeFunc,
    readFileFunc,
}: {
    inputValue: string;
    onChangeFunc: (value: string) => void;
    readFileFunc: () => Promise<void>;
}) {
    return (
        <>
            <Text variant="titleLarge" className="mt-4">
                Klucz prywatny RSA
            </Text>
            <View className="mt-2 flex-row items-center">
                <TextInput
                    mode="outlined"
                    className="mr-5 basis-8/12"
                    defaultValue={mmkvStorage.getString("privateKey")}
                    value={inputValue}
                    onChangeText={(value) => {
                        onChangeFunc(value);
                    }}
                />
                <View className="mt-2 flex-row items-center space-x-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
                    <Icon name="folder-open-outline" size={40} onPress={readFileFunc} />
                </View>
            </View>
        </>
    );
}

export default function ContactView() {
    const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);
    const [contact, setContact] = React.useState<Contact | undefined>(undefined);
    const [updateMode, setUpdateMode] = React.useState<boolean>(false);
    const [contactBuilder, setContactBuilder] = React.useState({
        name: "",
        surname: "",
        publicKey: "",
    });
    const [privateKey, setPrivateKey] = React.useState<string>(
        mmkvStorage.getString("privateKey") ?? "",
    );

    const publicKey = useQrScannedStore((state) => state.publicKey);
    const setPublicKey = useQrScannedStore((state) => state.setPublicKey);

    const params = useLocalSearchParams();
    const { contactId } = params;
    const router = useRouter();

    function isFirstParty() {
        return contactId === "0";
    }

    function isExistingContact() {
        return Boolean(contactId) && contactId !== "-1";
    }

    // If it's existing contact's id (i.e. id != -1) - pull contact data from db and populate state
    React.useEffect(() => {
        (async () => {
            if (isExistingContact()) {
                logger.info(
                    `[ContactView.useEffect] Fetching contact info for contactId=${JSON.stringify(
                        contactId,
                    )}.`,
                );
                const dbQueryResult = await getContactById(Number(contactId), sqlDbSession);
                if (!dbQueryResult) {
                    logger.error(
                        `[ContactView.useEffect] User with contactId=${JSON.stringify(
                            contactId,
                        )} not found in storage.`,
                    );
                } else {
                    setContact(dbQueryResult);
                }
            } else {
                logger.info(`[ContactView.useEffect] Creating new contact.`);
            }
        })();
    }, [contactId]);

    // Filling forms with contact data fetched from db.
    // Switching to update mode.
    React.useEffect(() => {
        if (contact) {
            logger.info(
                "[ContactView.useEffect] Pulled contact data from db successfully. Filling forms with contact data and going into update mode.",
            );
            setContactBuilder({
                name: contact.name,
                surname: contact.surname,
                publicKey: contact.publicKey,
            });
            setUpdateMode(true);
        }
    }, [contact]);

    // Updating form with scanned RSA key
    React.useEffect(() => {
        if (publicKey) {
            logger.info("[ContactView.useEffect] Updating form with scanned RSA key.");
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
            logger.error(
                "[ContactView.verifyContactBuilder] Contact builder verification unsuccessful. Some fields are not strings.",
            );
            return false;
        }
        if (
            (contactBuilder.name.length < 1 && contactBuilder.surname.length < 1) ||
            contactBuilder.publicKey.length < 1
        ) {
            logger.error(
                "[ContactView.verifyContactBuilder] Contact builder verification unsuccessful. Some fields are empty.",
            );
            return false;
        }
        logger.info("[ContactView.verifyContactBuilder] Contact builder verification successful.");
        return true;
    };

    const updatePublicKeyOnServer = async (pubKey: string): Promise<boolean> => {
        const userLogin = mmkvStorage.getString("login");
        if (!userLogin) {
            throw new PreconditionError("User login not found in storage.");
        }
        return updatePublicKey(userLogin, pubKey);
    };

    const handleContactSave = async (): Promise<void> => {
        logger.info("[ContactView.handleContactSave] Handling contact save.");
        if (!verifyContactBuilder()) {
            // verification failed
            logger.info("[ContactView.handleContactSave] Form validation failed.");
            Alert.alert(
                "Błąd",
                "Nie zapisano kontaktu. Sprawdź poprawność danych.",
                [GENERIC_OKAY_DISMISS_ALERT_BUTTON],
                { cancelable: true },
            );
        } else {
            const contactFromBuilder: Contact = new Contact(
                contactBuilder.name.trim(),
                contactBuilder.surname.trim(),
                contactBuilder.publicKey,
                Number(contactId) === -1 ? undefined : Number(contactId),
            );
            setPublicKey("");
            let dbQueryResult = false;
            if (!updateMode) {
                logger.info("[ContactView.handleContactSave] Adding new contact to database.");
                dbQueryResult = await addContact(contactFromBuilder, sqlDbSession);
            } else {
                if (isFirstParty() && privateKey !== mmkvStorage.getString("privateKey")) {
                    logger.info(
                        "[ContactView.handleContactSave] Updating user's private key in storage.",
                    );
                    mmkvStorage.set("privateKey", privateKey);
                }
                if (
                    isFirstParty() &&
                    contactBuilder.publicKey !== mmkvStorage.getString("publicKey")
                ) {
                    logger.info(
                        "[ContactView.handleContactSave] Updating user's public key on server.",
                    );
                    const serverUpdateResult = await updatePublicKeyOnServer(
                        contactBuilder.publicKey,
                    );
                    if (!serverUpdateResult) {
                        logger.error(
                            "[ContactView.handleContactSave] Failed to update user's public key on server. Skipping contact update in the database.",
                        );
                        Alert.alert(
                            "Błąd",
                            "Nie udało się zaktualizować klucza publicznego na serwerze.",
                            [GENERIC_OKAY_DISMISS_ALERT_BUTTON],
                            { cancelable: true },
                        );
                        return;
                    }
                }
                logger.info("[ContactView.handleContactSave] Updating contact in database.");
                dbQueryResult = await updateContact(contactFromBuilder, sqlDbSession);
            }
            if (!dbQueryResult) {
                logger.error("[ContactView.handleContactSave] Failed to save contact to database.");
                Alert.alert(
                    "Błąd",
                    "Nie udało się zapisać kontaktu. Błąd bazy danych.",
                    [GENERIC_OKAY_DISMISS_ALERT_BUTTON],
                    { cancelable: true },
                );
                return;
            }
            logger.info("[ContactView.handleContactSave] Contact saved to database successfully.");
            Toast.show(updateMode ? "Kontakt został zaktualizowany." : "Kontakt został zapisany.", {
                duration: Toast.durations.SHORT,
            });
            router.back();
        }
    };

    const handleContactRemove = (): void => {
        logger.info("[ContactView.handleContactRemove] Handling contact remove.");
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
                            const dbQueryResult = await removeContact(
                                Number(contactId),
                                sqlDbSession,
                            );
                            if (!dbQueryResult) {
                                logger.error(
                                    "[ContactView.handleContactRemove] Failed to remove contact from database.",
                                );
                                Alert.alert(
                                    "Błąd",
                                    "Nie udało się usunąć kontaktu. Błąd bazy danych.",
                                    [GENERIC_OKAY_DISMISS_ALERT_BUTTON],
                                    { cancelable: true },
                                );
                                return;
                            }
                            logger.info(
                                "[ContactView.handleContactRemove] Contact removed from database successfully.",
                            );
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

    const handleImportPublicRsaKey = React.useCallback(async () => {
        logger.info("[ContactView.handleImportPublicRsaKey] Handling RSA key import.");
        const rsaKey = await selectRsaKeyFile();
        if (!rsaKey) {
            logger.warn("[ContactView.handleImportPublicRsaKey] No RSA key file selected.");
            return;
        }
        logger.info("[ContactView.handleImportPublicRsaKey] Selected RSA key file.");
        setContactBuilder({ ...contactBuilder, publicKey: rsaKey });
    }, [selectRsaKeyFile]);

    const handleImportPrivateRsaKey = React.useCallback(async () => {
        logger.info("[ContactView.handleImportPrivateRsaKey] Handling RSA key import.");
        const rsaKey = await selectRsaKeyFile();
        if (!rsaKey) {
            logger.warn("[ContactView.handleImportPrivateRsaKey] No RSA key file selected.");
            return;
        }
        logger.info("[ContactView.handleImportPrivateRsaKey] Selected RSA key file.");
        setPrivateKey(rsaKey);
    }, [selectRsaKeyFile]);

    const handleGenerateKeyPair = async () => {
        logger.info("[ContactView.handleGenerateKeyPair] Handling RSA key pair generation.");
        const keyPair = await generateKeyPair();
        setContactBuilder({ ...contactBuilder, publicKey: keyPair.publicKey });
        setPrivateKey(keyPair.privateKey);
        Toast.show("Wygenerowano nową parę kluczy", {
            duration: Toast.durations.SHORT,
        });
    };

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
                {updateMode && contactId === "0" ? <LoginField /> : null}
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
                        <Icon
                            name="folder-open-outline"
                            size={40}
                            // eslint-disable-next-line @typescript-eslint/no-misused-promises
                            onPress={handleImportPublicRsaKey}
                        />
                        {isFirstParty() ? (
                            <Icon
                                name="reload-outline"
                                size={40}
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                onPress={handleGenerateKeyPair}
                            />
                        ) : (
                            <Link href="/qrScanner" asChild>
                                <Icon name="qr-code-outline" size={40} />
                            </Link>
                        )}
                    </View>
                </View>
                {isFirstParty() ? (
                    <PrivateKeyField
                        inputValue={privateKey}
                        onChangeFunc={setPrivateKey}
                        readFileFunc={handleImportPrivateRsaKey}
                    />
                ) : null}
                {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
                <Button mode="contained" className="mx-auto my-7 w-40" onPress={handleContactSave}>
                    Zapisz
                </Button>
                <View className="grow">
                    {updateMode && !isFirstParty ? (
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
