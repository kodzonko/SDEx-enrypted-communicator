import { formatDistance } from "date-fns";
import pl from "date-fns/locale/pl";
import * as React from "react";
import { FlatList,SafeAreaView,TouchableOpacity } from "react-native";
import { Appbar,Divider,List } from "react-native-paper";
import { getChatRooms } from "../storage/DataHandlers";
import { ChatRoomListItem,ChatRoomsScreenPropsType } from "../Types";
import { sortDescendingByDate } from "../utils/Sort";

/**
 * Screen displaying all threads existing in local persistent storage + fetched from the server.
 *
 * @returns {JSX.Element}
 * @constructor
 */
function ChatRoomsScreen({ navigation }: ChatRoomsScreenPropsType) {
  const [chatRooms, setChatRooms] = React.useState<ChatRoomListItem[]>([]);

  React.useEffect(() => {
    const chatRooms = getChatRooms()
      .then((chatRoomsUnsorted) => {
        const chatRoomsSorted = sortDescendingByDate(chatRoomsUnsorted);
        setChatRooms(chatRoomsSorted);
      })
      .catch((error) => {});
  }, []);

  /**
   * Returns a badge if count > 0 else right arrow.
   */
  const makeBadge = (count: any) => {
    const icon =
      count > 0 && count < 10 ? `numeric-${count}-circle` : "numeric-9-plus-circle";

    return count > 0 ? (
      <List.Icon icon={icon} color="red" />
    ) : (
      <List.Icon icon="arrow-right-circle" />
    );
  };

  return (
    <SafeAreaView className="flex-1">
      <Appbar.Header>
        <Appbar.Content title="Wiadomości" />
        {/* <Appbar.Action */}
        {/*   size={30} */}
        {/*   className="mr-2" */}
        {/*   icon="cog-outline" */}
        {/*   onPress={() => { */}
        {/*     navigation.navigate("Settings"); */}
        {/*   }} */}
        {/* /> */}
      </Appbar.Header>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.name + item.surname}
        ItemSeparatorComponent={() => <Divider />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate("Chat")}>
            <List.Item
              title={`${item.name} ${item.surname}`}
              description={formatDistance(new Date(item.lastMsgDate), new Date(), {
                addSuffix: true,
                locale: pl,
              })}
              left={(props) => <List.Icon {...props} icon="email" />}
              right={(props) => makeBadge(item.unreadMsgCount)}
              titleNumberOfLines={1}
              descriptionNumberOfLines={1}
            />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

export default ChatRoomsScreen;
