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
            router.replace("/sign-in");
        } else {
            logger.info("Registering client on the server...");
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            requestRegister();
            router.replace("/chats");
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
