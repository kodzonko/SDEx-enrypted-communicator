import * as React from "react";
import { BottomNavigation } from "react-native-paper";
import ContactsScreen from "../screens/ContactsScreen";
import ChatRoomsScreen from "../screens/ChatRoomsScreen";
import { getUnreadCount } from "../../utils/localStorage";

const BottomTabNavigator = () => {
  const [index, setIndex] = React.useState(0);
  const unreadCount = getUnreadCount();
  const [routes] = React.useState([{
    key: "chatRooms",
    title: "Wiadomości",
    focusedIcon: "email",
    unfocusedIcon: "email-outline",
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    badge: unreadCount > 0 ? unreadCount : null
  }, {
    key: "contacts", title: "Kontakty", focusedIcon: "contacts", unfocusedIcon: "contacts-outline"
  }]);

  const renderScene = BottomNavigation.SceneMap({
    chatRooms: ChatRoomsScreen, contacts: ContactsScreen
  });

  return (
    <BottomNavigation
      // @ts-expect-error TS(2322): Type '({ key: string; title: string; focusedIcon: ... Remove this comment to see the full error message
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      shifting={true}
    />
  );
};

export default BottomTabNavigator;