import * as React from "react";

import ContactsScreen from "../screens/ContactsScreen";

function BottomTabNavigator() {
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

  const renderScene = BotomNavigation.SceneMap({
    chatRooms: ChatRoomsScreen,
    contacts: ContactsScreen,
  });

  return (
    <BottomNavigation
      navigationState={{
        index,
        routes,
      }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      shifting
    />
  );
}

export default BottomTabNavigator;
