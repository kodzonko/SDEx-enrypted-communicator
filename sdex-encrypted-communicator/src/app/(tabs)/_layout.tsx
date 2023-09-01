import { Ionicons } from "@expo/vector-icons";
import { BottomTabBar, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import * as React from "react";
import { useTheme } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import socket, { requestRegister } from "../../communication/Sockets";
import { useCryptoContextStore } from "../../contexts/CryptoContext";
import { useSqlDbSessionStore } from "../../contexts/DbSession";
import {
  generateHashFromUserPassword,
  generateInitializationHash,
} from "../../crypto/cryptoHelpers";
import logger from "../../Logger";

function makeIcon(
  icon: keyof typeof Ionicons.glyphMap,
  activeIcon: keyof typeof Ionicons.glyphMap,
) {
  // eslint-disable-next-line func-names
  return function (props: { size: number; color: string; focused: boolean }) {
    const { size } = props;
    const { color } = props;
    const { focused } = props;
    return <Icon size={size} name={focused ? activeIcon : icon} color={color} />;
  };
}

function makeBottomTabs(props: BottomTabBarProps) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <BottomTabBar {...props} />;
}

export default function TabsLayout() {
  const setSqlDbSession = useSqlDbSessionStore((state) => state.setSqlDbSession);
  const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);
  const setMyCryptoContext = useCryptoContextStore((state) => state.setMyCryptoContext);

  const theme = useTheme();

  React.useEffect(() => {
    logger.info("Initializing random context for SDEx cryptography.");
    (async () => {
      const initializationHash = generateInitializationHash();
      const hashFromUserPassword = await generateHashFromUserPassword();
      setMyCryptoContext(initializationHash, hashFromUserPassword);
    })();
  }, []);

  React.useEffect(() => {
    requestRegister();
  }, [socket.connected]);

  React.useEffect(() => {
    if (!sqlDbSession) {
      (() => setSqlDbSession())();
    }
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { height: 70 },
        unmountOnBlur: true,
      }}
      tabBar={makeBottomTabs}
    >
      <Tabs.Screen
        name="chats/index"
        options={{
          tabBarIcon: makeIcon("chatbubbles-outline", "chatbubbles"),
        }}
      />
      <Tabs.Screen
        name="contacts/index"
        options={{
          tabBarIcon: makeIcon("book-outline", "book"),
        }}
      />
    </Tabs>
  );
}
