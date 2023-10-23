import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import * as React from "react";
import { Alert, FlatList, SafeAreaView, StyleProp, ViewStyle } from "react-native";
import { Appbar, Dialog, Divider, List, Portal, Text } from "react-native-paper";
import Toast from "react-native-root-toast";
import socket, { requestRegister, socketConnect } from "../../communication/Sockets";
import {
    GENERIC_OKAY_DISMISS_ALERT_BUTTON,
    GENERIC_OKAY_DISMISS_BUTTON,
} from "../../components/Buttons";
import QrCodeDialog from "../../components/QrCodeDialog";
import { useAuthStore } from "../../contexts/Auth";
import { useKeyPairStore } from "../../contexts/KeyPair";
import { exportKeyPair } from "../../crypto/RsaCrypto";
import logger from "../../Logger";
import { shareFile } from "../../storage/FileOps";
import { mmkvStorage } from "../../storage/MmkvStorageMiddlewares";
import styles from "../../Styles";

export default function Settings() {
    const router = useRouter();
    const signOut = useAuthStore((state) => state.signOut);
    const [qrDialogVisible, setQrDialogVisible] = React.useState(false);
    const [aboutAppDialogVisible, setAboutAppDialogVisible] = React.useState(false);
    const setPublicKey = useKeyPairStore((state) => state.setPublicKey);
    const setPrivateKey = useKeyPairStore((state) => state.setPrivateKey);

    const showQrDialog = () => {
        logger.info(`Showing QR code dialog.`);
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

    const disconnectFromServer = () => {
        socket.disconnect();
    };
    const handleExportKeys = async () => {
        const privateKey = mmkvStorage.getString("privateKey");
        const pubKey = mmkvStorage.getString("publicKey");
        if (!privateKey || !pubKey) {
            Alert.alert("Błąd", "Nie znaleziono kluczy szyfrujących w pamięci urządzenia.", [
                GENERIC_OKAY_DISMISS_ALERT_BUTTON,
            ]);
        } else {
            await exportKeyPair({ privateKey, publicKey: pubKey });
            if (!FileSystem.documentDirectory) {
                throw new Error("Document directory not found");
            }
            const publicKeyUri = `${FileSystem.documentDirectory}id_rsa.pub.txt`;
            const privateKeyUri = `${FileSystem.documentDirectory}id_rsa.txt`;
            const successPublic = await shareFile(publicKeyUri);
            if (successPublic) {
                Toast.show("Klucz publiczny wyeksportowany", {
                    duration: Toast.durations.SHORT,
                });
            } else {
                logger.error(`Error while exporting public key.`);
                Alert.alert("Błąd zapisu", "Nie udało się wyeksportować klucza publicznego", [
                    GENERIC_OKAY_DISMISS_ALERT_BUTTON,
                ]);
            }
            const successPrivate = await shareFile(privateKeyUri);
            if (successPrivate) {
                Toast.show("Klucz prywatny wyeksportowany", {
                    duration: Toast.durations.SHORT,
                });
            } else {
                logger.error(`Error while exporting private key.`);
                Alert.alert("Błąd zapisu", "Nie udało się wyeksportować klucza prywatnego", [
                    GENERIC_OKAY_DISMISS_ALERT_BUTTON,
                ]);
            }
        }
    };

    const handleConnect = async () => {
        socketConnect();
        await requestRegister();
    };

    const settingsItems = [
        { title: "Wyloguj", func: handleSignOut },
        { title: "Pokaż QR", func: showQrDialog },
        { title: "O aplikacji", func: showAboutAppDialog },
        {
            title: "Eksportuj klucze",
            func: handleExportKeys,
        },
    ];

    React.useEffect(() => {
        if (!socket.connected) {
            settingsItems.push({
                title: "Połącz z serwerem",
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                func: handleConnect,
            });
        } else {
            settingsItems.push({ title: "Wyloguj z serwera", func: disconnectFromServer });
        }
    }, [socket.connected]);

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
            <QrCodeDialog
                visible={qrDialogVisible}
                hideFunc={hideQrDialog}
                content={mmkvStorage.getString("publicKey") as string}
            />
            <Portal>
                <Dialog visible={aboutAppDialogVisible} onDismiss={hideAboutAppDialog}>
                    <Dialog.Title style={{ textAlign: "center" }}>O aplikacji</Dialog.Title>
                    <Dialog.Content className="flex items-center">
                        <Text className="text-base">
                            SDEx Communicator to aplikacja do bezpiecznej, szyfrowanej komunikacji
                            na urządzeniach iOS i Android. Aplikacja umożliwia szyfrowaną wymianę
                            wiadomości oraz plików pomiędzy użytkownikami, a także zarządzanie
                            kluczami szyfrującymi.{"\n"}
                            {"\n"}
                            Program używa algorytmu szyfrowania SDEx z funkcją skrótu BLAKE3. Klucze
                            szyfrujące są tworzone algorytmem RSA. A wymiana wiadomości odbywa się
                            za pomocą protokołu TLS 1.3
                            {"\n"}
                            {"\n"}
                            Wiadomości i dane kontaktowe są przechowywane wyłącznie na urządzeniu
                            użytkownika. Użytkownik jest jedynym powiernikiem swoich danych, nie ma
                            możliwości ich odszyfrowania w przypadku utraty PINu.{"\n"}
                            {"\n"}
                            Aplikacja została stworzona w ramach pracy inżynierskiej na Politechnice
                            Łódzkiej.
                        </Text>
                        <GENERIC_OKAY_DISMISS_BUTTON dismissFunc={hideAboutAppDialog} />
                    </Dialog.Content>
                </Dialog>
            </Portal>

            <FlatList
                className="mt-2"
                data={settingsItems}
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
