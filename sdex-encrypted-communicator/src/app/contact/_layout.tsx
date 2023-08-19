import { Stack } from "expo-router";
import * as React from "react";

export default function ContactLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[contactId]" />
    </Stack>
  );
}
