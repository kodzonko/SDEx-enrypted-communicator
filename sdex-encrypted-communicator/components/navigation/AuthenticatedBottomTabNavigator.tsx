import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import * as React from "react";
import { Platform } from "react-native";
import { useSqlDbSessionStore } from "../Contexts";
import logger from "../Logger";
import { getUnreadCount } from "../storage/DataHandlers";
import { AuthenticatedBottomTabNavigationParamList } from "../Types";
import ChatRoomsStackNavigator from "./ChatRoomsStackNavigator";
import ContactsStackNavigator from "./ContactsStackNavigator";

const Tab = createBottomTabNavigator<AuthenticatedBottomTabNavigationParamList>();

function AuthenticatedBottomTabNavigator(props: any) {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);
  const setSqlDbSession = useSqlDbSessionStore((state) => state.setSqlDbSession);
  React.useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        logger.info(
          "This platform supports expo-sqlite, establishing SQL database session.",
        );
        setSqlDbSession();
      }
      setUnreadCount(await getUnreadCount(sqlDbSession));
    })();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="ChatRoomsStack"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === "ChatRoomsStack") {
              iconName = focused ? "chatbubbles" : "chatbubbles-outline";
            } else if (route.name === "ContactsStack") {
              iconName = focused ? "book" : "book-outline";
            }
            // @ts-ignore
            return <Ionicons name={iconName} size={35} />;
          },
          tabBarActiveTintColor: "tomato",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: { height: 70 },
          headerShown: false,
          tabBarShowLabel: false,
          unmountOnBlur: true,
        })}
      >
        <Tab.Screen
          name="ChatRoomsStack"
          component={ChatRoomsStackNavigator}
          options={{ tabBarBadge: unreadCount }}
        />
        <Tab.Screen name="ContactsStack" component={ContactsStackNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default AuthenticatedBottomTabNavigator;
