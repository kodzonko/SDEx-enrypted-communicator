import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import * as React from "react";
import ChatRoomsScreen from "../screens/ChatRoomsScreen";
import ContactsScreen from "../screens/ContactsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { getUnreadCount } from "../storage/DataHandlers";

const Tab = createBottomTabNavigator();

function AuthenticatedBottomTabNavigator(props: any) {
  const [index, setIndex] = React.useState(0);
  const unreadCount = getUnreadCount();
  const [routes] = React.useState([
    {
      key: "chatRooms",
      title: "Wiadomości",
      focusedIcon: "email",
      unfocusedIcon: "email-outline",
      // badge: unreadCount > 0 ? unreadCount : null,
      badge: unreadCount,
    },
    {
      key: "contacts",
      title: "Kontakty",
      focusedIcon: "contacts",
      unfocusedIcon: "contacts-outline",
    },
  ]);

  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="ChatRooms" component={ChatRoomsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
        <Tab.Screen name="Contacts" component={ContactsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default AuthenticatedBottomTabNavigator;
