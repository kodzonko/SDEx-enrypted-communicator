import * as React from "react";
import { Dimensions, SafeAreaView, View } from "react-native";
import { GiftedChat, IMessage as GiftedChatMessage } from "react-native-gifted-chat";

import { Appbar } from "react-native-paper";

import { useContactIdStore, useSqlDbSessionStore } from "../Contexts";
import { DataHandlerError } from "../Errors";
import { getContactById, getMessagesByContactId } from "../storage/DataHandlers";
import styles from "../Styles";
import { ChatRoomsStackChatScreenPropsType } from "../Types";
import { messageToGiftedChatMessage } from "../utils/Converters";

function ChatScreen({ navigation }: ChatRoomsStackChatScreenPropsType) {
  const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);
  const [messages, setMessages] = React.useState<GiftedChatMessage[]>([]);
  const contactId = useContactIdStore((state) => state.contactId);

  React.useEffect(() => {
    (async () => {
      const userFromStorage = await getContactById(contactId, sqlDbSession);
      if (!userFromStorage) {
        throw new DataHandlerError(`User with id ${contactId} not found in storage.`);
      }
      const messagesFromStorage = await getMessagesByContactId(contactId, sqlDbSession);
      const giftedChatMessages: GiftedChatMessage[] = [];
      messagesFromStorage.forEach((message) => {
        giftedChatMessages.push(messageToGiftedChatMessage(message, userFromStorage));
      });
      setMessages(giftedChatMessages);
    })();
  }, []);

  const onSend = React.useCallback((messages: GiftedChatMessage[] = []) => {
    setMessages((previousMessages) => GiftedChat.append(previousMessages, messages));
  }, []);

  const { width, height } = Dimensions.get("window");

  return (
    <SafeAreaView className="flex-1">
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content title="<username>" titleStyle={styles.appBarTitle} />
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          iconColor={styles.appBarIcons.color}
        />
      </Appbar.Header>
      <View
        style={{
          width,
          height,
        }}
      >
        <GiftedChat
          messages={messages}
          onSend={(messages) => onSend(messages)}
          user={{
            _id: 0,
            name: "Ty",
          }}
        />
      </View>
    </SafeAreaView>
  );
}

export default ChatScreen;
