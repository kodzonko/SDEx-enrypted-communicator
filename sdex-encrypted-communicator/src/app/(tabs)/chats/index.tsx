import { formatDistance } from "date-fns";
import pl from "date-fns/locale/pl";

import { BlurView } from "@react-native-community/blur";
import { useIsFocused } from "@react-navigation/native";
import { Link } from "expo-router";
import * as React from "react";
import { FlatList, SafeAreaView, StyleProp, ViewStyle } from "react-native";
import { Appbar, Divider, FAB, List } from "react-native-paper";
import AddChatRoomModal from "../../../components/AddChatRoomModal";
import { useChatRoomsStore } from "../../../contexts/ChatRooms";
import { useSqlDbSessionStore } from "../../../contexts/DbSession";
import logger from "../../../Logger";
import { getChatRooms } from "../../../storage/DataHandlers";
import styles from "../../../Styles";
import { sortChatRoomsDescendingByDate } from "../../../utils/Sort";

/**
 * Screen displaying all threads existing in local persistent storage + fetched from the server.
 */
export default function ChatRooms() {
  const [addChatRoomModalVisible, setAddChatRoomModalVisible] = React.useState(false);

  const isFocused = useIsFocused();

  const chatRooms = useChatRoomsStore((state) => state.chatRooms);
  const setChatRooms = useChatRoomsStore((state) => state.setChatRooms);
  const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);
  const setSqlDbSession = useSqlDbSessionStore((state) => state.setSqlDbSession);

  const divider = () => <Divider />;
  const leftIcon = (props: { color: string; style?: StyleProp<ViewStyle> }) => (
    /* eslint-disable-next-line react/jsx-props-no-spreading */
    <List.Icon {...props} icon="email" />
  );

  React.useEffect(() => {
    if (isFocused) {
      (async () => {
        const chatRoomsFromDb = await getChatRooms(sqlDbSession);
        const sortedChatRooms = sortChatRoomsDescendingByDate(chatRoomsFromDb);
        setChatRooms(sortedChatRooms);
      })();
    }
    if (!sqlDbSession) {
      logger.info("sqlDbSession is undefined. Creating a new one.");
      setSqlDbSession();
    }
  }, [sqlDbSession, isFocused]);

  /**
   * Returns a badge if count > 0 else right arrow.
   */
  const makeBadge = (count: number) => {
    const icon = count > 0 && count < 10 ? `numeric-${count}-circle` : "numeric-9-plus-circle";

    return count > 0 ? (
      <List.Icon icon={icon} color="red" />
    ) : (
      <List.Icon icon="arrow-right-circle" />
    );
  };

  const showModal = () => {
    logger.info("Showing AddChatRoomModal.");
    setAddChatRoomModalVisible(true);
  };
  const hideModal = () => setAddChatRoomModalVisible(false);

  return (
    <SafeAreaView className="flex-1">
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content title="Wiadomości" titleStyle={styles.appBarTitle} />
        <Link href="/settings" asChild>
          <Appbar.Action icon="cog" iconColor={styles.appBarIcons.color} />
        </Link>
      </Appbar.Header>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.name + item.surname}
        ItemSeparatorComponent={divider}
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: "/chat/[contactId]",
              params: { contactId: item.contactId },
            }}
            asChild
          >
            <List.Item
              title={`${item.name} ${item.surname}`}
              description={formatDistance(new Date(item.lastMessageDate), new Date(), {
                addSuffix: true,
                locale: pl,
              })}
              left={leftIcon}
              right={() => makeBadge(item.unreadMessageCount)}
              titleNumberOfLines={1}
              descriptionNumberOfLines={1}
            />
          </Link>
        )}
      />
      {addChatRoomModalVisible && (
        <>
          <FAB icon="plus" style={styles.fab} onPress={() => showModal()} />
          <BlurView
            style={styles.blurView}
            blurType="light"
            blurAmount={10}
            reducedTransparencyFallbackColor="white"
          />
        </>
      )}
      <AddChatRoomModal visible={addChatRoomModalVisible} hideFunction={hideModal} />
      {!addChatRoomModalVisible && (
        <FAB icon="plus" style={styles.fab} onPress={() => showModal()} />
      )}
    </SafeAreaView>
  );
}
