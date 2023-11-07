import { Link } from "expo-router";
import * as React from "react";
import { Alert, KeyboardAvoidingView, SafeAreaView, View } from "react-native";
import { Appbar, Button, TextInput } from "react-native-paper";
import { GENERIC_OKAY_DISMISS_ALERT_BUTTON } from "../../components/Buttons";
import { useAuthStore } from "../../contexts/Auth";
import logger from "../../Logger";
import { GENERIC_AUTHORIZATION_ERROR_MSG } from "../../Messages";
import { mmkvStorage } from "../../storage/MmkvStorageMiddlewares";
import styles from "../../Styles";

export default function SignIn() {
    const actualLogin = mmkvStorage.getString("login") || "";
    const [userInputPin, setUserInputPin] = React.useState("");
    const [userInputLogin, setUserInputLogin] = React.useState(actualLogin);
    const signIn = useAuthStore((state) => state.signIn);

    const handleSignIn = React.useCallback(() => {
        logger.info("[SignIn.handleSignIn] Verifying user PIN.");
        const actualPin = mmkvStorage.getString("userPin");
        logger.debug(`[SignIn.handleSignIn] Actual PIN: ${JSON.stringify(actualPin)}`);
        if (!actualLogin || !actualPin) {
            Alert.alert(
                GENERIC_AUTHORIZATION_ERROR_MSG,
                "Brak PINu lub loginu, uwierzytelnienie jest niemożliwe.",
                [GENERIC_OKAY_DISMISS_ALERT_BUTTON],
            );
            return;
        }
        if (
            userInputPin.trim() === actualPin &&
            actualLogin.length > 0 &&
            userInputLogin.trim() === actualLogin
        ) {
            logger.info("[SignIn.handleSignIn] PIN verified, signing in.");
            signIn();
        } else {
            logger.info("[SignIn.handleSignIn] PIN verified as incorrect.");
            Alert.alert(GENERIC_AUTHORIZATION_ERROR_MSG, "PIN lub login jest niepoprawny", [
                GENERIC_OKAY_DISMISS_ALERT_BUTTON,
            ]);
        }
    }, [signIn, userInputPin, userInputLogin, actualLogin]);

    return (
        <SafeAreaView className="flex flex-1 flex-col">
            <Appbar.Header style={styles.appBarHeader}>
                <Appbar.Content
                    title="Logowanie"
                    titleStyle={styles.appBarTitle}
                    className="ml-11"
                />
            </Appbar.Header>
            <View className="my-auto items-center justify-center">
                <TextInput
                    keyboardType="default"
                    className="mb-4"
                    mode="outlined"
                    style={styles.textInput}
                    placeholder={actualLogin || "Wprowadź login"}
                    value={userInputLogin}
                    onChangeText={(value) => {
                        setUserInputLogin(value);
                    }}
                />
                <TextInput
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.textInput}
                    secureTextEntry
                    autoFocus
                    maxLength={8}
                    placeholder="Wprowadź PIN"
                    value={userInputPin}
                    onChangeText={(value) => {
                        setUserInputPin(value);
                    }}
                />
                <Button
                    mode="contained"
                    className="my-7 w-40"
                    onPress={handleSignIn}
                    disabled={!userInputLogin || !userInputPin}
                >
                    Zaloguj
                </Button>
            </View>
            <KeyboardAvoidingView className="mb-2 mt-auto">
                <Link href="/sign-up" asChild>
                    <Button mode="text" className="mt-7 align-bottom">
                        Nie masz konta? Załóż je {">"}
                    </Button>
                </Link>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
