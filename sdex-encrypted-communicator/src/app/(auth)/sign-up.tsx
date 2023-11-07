import { Link } from "expo-router";
import * as React from "react";
import { Alert, KeyboardAvoidingView, SafeAreaView, ScrollView } from "react-native";
import { Appbar, Button, Surface, Text, TextInput } from "react-native-paper";
import { GENERIC_OKAY_DISMISS_ALERT_BUTTON } from "../../components/Buttons";
import QrCodeDialog from "../../components/QrCodeDialog";
import RsaKeysCreatorDialog from "../../components/RsaKeysCreatorDialog";
import { useAuthStore } from "../../contexts/Auth";
import { useSqlDbSessionStore } from "../../contexts/DbSession";
import { useKeyPairStore } from "../../contexts/KeyPair";
import logger from "../../Logger";
import { GENERIC_WRITE_ERROR_TITLE } from "../../Messages";
import { addContact } from "../../storage/DataHandlers";
import { mmkvStorage } from "../../storage/MmkvStorageMiddlewares";
import { createDb } from "../../storage/SqlStorageMiddlewares";
import styles from "../../Styles";
import { Contact } from "../../Types";

export default function SignUp(): Element {
    const [userPin, setUserPin] = React.useState<string>("");
    const [login, setLogin] = React.useState<string>(mmkvStorage.getString("login") || "");
    const [userPinRepeated, setUserPinRepeated] = React.useState<string>("");
    const [keyObtainDialogVisible, setKeyObtainDialogVisible] = React.useState(false);
    const [qrExportDialogVisible, setQrExportDialogVisible] = React.useState(false);
    const [firstPartyContact, setFirstPartyContact] = React.useState<Contact | null>(null);

    const signIn = useAuthStore((state) => state.signIn);
    const publicKey = useKeyPairStore((state) => state.publicKey);
    const privateKey = useKeyPairStore((state) => state.privateKey);
    const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);
    const setSqlDbSession = useSqlDbSessionStore((state) => state.setSqlDbSession);

    React.useEffect(() => {
        // Adding your contact to the database
        // and handles actual signing in process
        if (sqlDbSession && firstPartyContact && login) {
            (async () => {
                const result = await addContact(firstPartyContact, sqlDbSession);
                if (result) {
                    logger.info("[SignUp.useEffect] Your contact has been added to the database.");
                    logger.info("[SignUp.useEffect] Signing in...");
                    // Signing in to the app
                    signIn();
                } else {
                    logger.error(
                        "[SignUp.useEffect] An error occurred when trying to save user's contact to database.",
                    );
                    Alert.alert(
                        GENERIC_WRITE_ERROR_TITLE,
                        "Nie udało się zapisać twojego kontaktu.",
                        [GENERIC_OKAY_DISMISS_ALERT_BUTTON],
                    );
                }
            })();
        }
    }, [sqlDbSession, firstPartyContact]);

    /**
     * Handles signing in process.
     * - Saves first party's key pair in mmkv encrypted storage
     * - Creates first party's profile in contacts book,
     * - Switches isSignedIn flag to redirect expo router to authenticated stack (similar to sign-in screen)
     * - Parts of this function are executed in useEffect hook.
     */
    const handleSignUp = async (): Promise<void> => {
        mmkvStorage.set("userPin", userPin);
        mmkvStorage.set("privateKey", privateKey);
        mmkvStorage.set("publicKey", publicKey);
        mmkvStorage.set("login", login);
        logger.info("[SignUp.handleSignUp] Login, PIN and key pair saved successfully.");
        // Creating fresh sql db file from template. Creating a new session.
        logger.info("[SignUp.handleSignUp] SignUp successful. Creating a new app database.");
        await createDb()
            .then(async () => {
                await setSqlDbSession();
                setFirstPartyContact(new Contact("Twój profil", "", publicKey, 0));
            })
            .catch((error: Error) => {
                logger.error(
                    `[SignUp.handleSignUp] Failed to create a new app database: ${error.message})`,
                );
                Alert.alert(
                    GENERIC_WRITE_ERROR_TITLE,
                    "Nie udało się utworzyć nowej bazy danych.",
                    [GENERIC_OKAY_DISMISS_ALERT_BUTTON],
                );
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
                    <Text variant="titleLarge" className="mb-2">
                        Login
                    </Text>
                    <TextInput
                        keyboardType="default"
                        mode="outlined"
                        style={styles.textInput}
                        autoFocus={false}
                        placeholder="Utwórz login"
                        value={login}
                        onChangeText={(value) => setLogin(value)}
                    />
                    <Text variant="titleLarge" className="my-2">
                        PIN
                    </Text>
                    <TextInput
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.textInput}
                        secureTextEntry
                        autoFocus={false}
                        maxLength={8}
                        placeholder="Utwórz PIN"
                        value={userPin}
                        onChangeText={(value) => setUserPin(value)}
                    />
                    <TextInput
                        className="mt-1"
                        mode="outlined"
                        style={styles.textInput}
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
                            marginTop: 20,
                            paddingBottom: 20,
                        },
                    ]}
                >
                    <Text variant="titleLarge" className="my-2">
                        Klucze szyfrujące
                    </Text>
                    <Button
                        mode="contained"
                        onPress={showKeyObtainDialog}
                        className="mx-2 mb-2 w-40"
                    >
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
                            !privateKey ||
                            !publicKey ||
                            userPin.length < 4 ||
                            userPin !== userPinRepeated ||
                            !login
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
