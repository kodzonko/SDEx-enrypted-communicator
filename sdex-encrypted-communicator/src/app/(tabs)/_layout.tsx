import { Ionicons } from "@expo/vector-icons";
import { BottomTabBar, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import * as React from "react";
import { Platform } from "react-native";
import { useTheme } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import { useSqlDbSessionStore } from "../../contexts/DbSession";
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
  const theme = useTheme();

  React.useEffect(() => {
    if (Platform.OS !== "web" && !sqlDbSession) {
      logger.info("This platform supports expo-sqlite, establishing SQL database session.");
      setSqlDbSession();
    }
    // (async () => {
    //   if (Platform.OS !== "web" && !sqlDbSession) {
    //     logger.info("This platform supports expo-sqlite, establishing SQL database session.");
    //     setSqlDbSession();
    //   }
    // })();
  }, [sqlDbSession]);

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
