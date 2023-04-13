import * as React from "react";
import { BottomNavigation } from "react-native-paper";
import { getUnreadCount } from "../../databases/secureStoreMiddlewares";
import ChatRoomsScreen from "../screens/ChatRoomsScreen";
import ContactsScreen from "../screens/ContactsScreen";

const BottomTabNavigator = () => {
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

  const renderScene = BottomNavigation.SceneMap({
    chatRooms: ChatRoomsScreen,
    contacts: ContactsScreen,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      shifting={true}
    />
  );
};

export default BottomTabNavigator;
