import { Stack, useRouter } from "expo-router";
import * as React from "react";
import { PaperProvider } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { requestRegister } from "../communication/Sockets";
import { useAuthStore } from "../contexts/Auth";
import "../Globals";
import logger from "../Logger";
import { theme } from "../Styles";

export default function RootLayout() {
    const isSignedIn = useAuthStore((state) => state.isSignedIn);
    const router = useRouter();

    React.useEffect(() => {
        if (!isSignedIn) {
            try {
                router.replace("/sign-in");
            } catch (error) {
                logger.error(
                    `[RootLayout.useEffect] Error while trying to redirect to /sign-in: ${JSON.stringify(
                        error,
                    )}`,
                );
            }
        } else {
            logger.info("[RootLayout.useEffect] Registering client on the server...");
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            requestRegister();
            try {
                router.replace("/chats");
            } catch (error) {
                logger.error(
                    `[RootLayout.useEffect] Error while trying to redirect to /chats: ${JSON.stringify(
                        error,
                    )}`,
                );
            }
        }
    }, [isSignedIn]);

    return (
        <PaperProvider theme={theme}>
            <RootSiblingParent>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="(auth)" />
                </Stack>
            </RootSiblingParent>
        </PaperProvider>
    );
}
