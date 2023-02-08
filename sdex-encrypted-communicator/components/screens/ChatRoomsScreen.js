import * as React from "react";
import { FlatList, SafeAreaView, TouchableOpacity } from "react-native";
import { Appbar, Divider, List } from "react-native-paper";
import { formatDistance } from "date-fns";
import pl from "date-fns/locale/pl";
import { loadChatRooms } from "../../utils/localStorage";
import { useNavigation } from "@react-navigation/native";
import { sortDescendingByDate } from "../../utils/sort";

/**
 * Screen displaying all threads existing in local persistent storage + fetched from the server.
 *
 * @param navigation
 * @returns {JSX.Element}
 * @constructor
 */
const ChatRoomsScreen = () => {
  const navigation = useNavigation();
  const [chatRooms, setChatRooms] = React.useState([]);

  React.useEffect(() => {
    const chatRoomsUnsorted = loadChatRooms();
    const sortedChatRooms = sortDescendingByDate(chatRoomsUnsorted);
    setChatRooms(sortedChatRooms);
  }, []);

  /**
   * Returns a badge if count > 0 else right arrow.
   */
  const makeBadge = (count) => {
    let icon = count > 0 && count < 10 ? `numeric-${count}-circle` : "numeric-9-plus-circle";

    return count > 0 ? <List.Icon icon={icon} color="red" /> : <List.Icon icon="arrow-right-circle" />;
  };

  return (<SafeAreaView className="flex-1">
    <Appbar.Header>
      <Appbar.Content title="Wiadomości" />
      <Appbar.Action size={30} className="mr-2" icon="cog-outline" onPress={() => {
        navigation.navigate("Settings");
      }} />
    </Appbar.Header>
    <FlatList
      data={chatRooms}
      keyExtractor={item => item.id}
      ItemSeparatorComponent={() => <Divider />}
      renderItem={({ item }) => (<TouchableOpacity
        // onPress={() => navigation.navigate('Room', {thread: item})}
      >
        <List.Item
          title={`${item.name} ${item.surname}`}
          description={formatDistance(new Date(item.lastMsgDate), new Date(), {
            addSuffix: true, locale: pl
          })}
          left={(props) => <List.Icon {...props} icon="email" />}
          right={(props) => makeBadge(item.unreadMsgCount)}
          titleNumberOfLines={1}
          descriptionNumberOfLines={1}
        />
      </TouchableOpacity>)}
    />
  </SafeAreaView>);
};

export default ChatRoomsScreen;
