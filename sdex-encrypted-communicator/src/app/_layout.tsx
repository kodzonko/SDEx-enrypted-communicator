import { Stack, useRouter } from "expo-router";
import * as React from "react";
import { PaperProvider } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";
import { useAuthStore } from "../contexts/Auth";
import { theme } from "../Styles";

const test = async () => {};

export default function RootLayout() {
  const isSignedIn = useAuthStore((state) => state.isSignedIn);
  // const isSignedIn = true;
  const router = useRouter();
  React.useEffect(() => {
    (async () => {
      // const sth = await test();
      // logger.info(JSON.stringify(sth));
    })();
    if (!isSignedIn) {
      router.replace("/sign-in");
    } else {
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
