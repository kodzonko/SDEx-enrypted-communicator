import { Stack, useRouter } from "expo-router";
import * as React from "react";
import { PaperProvider } from "react-native-paper";

import { theme } from "../Styles";

export default function RootLayout() {
  // const isSignedIn = useAuthStore((state) => state.isSignedIn);
  const isSignedIn = false;
  const router = useRouter();
  React.useEffect(() => {
    if (!isSignedIn) {
      router.replace("/sign-in");
    } else {
      router.replace("/chats");
    }
  }, [isSignedIn]);

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </PaperProvider>
  );
}
