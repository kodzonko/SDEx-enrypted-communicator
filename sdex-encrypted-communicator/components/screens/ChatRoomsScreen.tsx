import { formatDistance } from "date-fns";
import pl from "date-fns/locale/pl";
import * as React from "react";
import { FlatList, SafeAreaView, TouchableOpacity } from "react-native";
import { Appbar, Divider, List } from "react-native-paper";
import {
  useChatRoomsStore,
  useContactIdStore,
  useSqlDbSessionStore,
} from "../Contexts";
import { getChatRooms } from "../storage/DataHandlers";
import styles from "../Styles";
import { ChatRoomsStackChatRoomsScreenPropsType } from "../Types";
import { sortChatRoomsDescendingByDate } from "../utils/Sort";

/**
 * Screen displaying all threads existing in local persistent storage + fetched from the server.
 */
function ChatRoomsScreen({ navigation }: ChatRoomsStackChatRoomsScreenPropsType) {
  const chatRooms = useChatRoomsStore((state) => state.chatRooms);
  const setChatRooms = useChatRoomsStore((state) => state.setChatRooms);
  const setContactId = useContactIdStore((state) => state.setContactId);
  const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);

  React.useEffect(() => {
    (async () => {
      const chatRoomsFromDb = await getChatRooms(sqlDbSession);
      const sortedChatRooms = sortChatRoomsDescendingByDate(chatRoomsFromDb);
      setChatRooms(sortedChatRooms);
    })();
  }, []);

  /**
   * Returns a badge if count > 0 else right arrow.
   */
  const makeBadge = (count: any) => {
    const icon = count > 0 && count < 10 ? `numeric-${count}-circle` : "numeric-9-plus-circle";

    return count > 0 ? (
      <List.Icon icon={icon} color="red" />
    ) : (
      <List.Icon icon="arrow-right-circle" />
    );
  };

  return (
    <SafeAreaView className="flex-1">
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content title="Wiadomości" titleStyle={styles.appBarTitle} />
        <Appbar.Action
          icon="cog"
          iconColor={styles.appBarIcons.color}
          onPress={() => navigation.navigate("Settings")}
        />
      </Appbar.Header>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.name + item.surname}
        ItemSeparatorComponent={() => <Divider />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setContactId(item.contactId);
              navigation.navigate("Chat");
            }}
          >
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
