import * as React from "react";
import { Dimensions, SafeAreaView, View } from "react-native";
import { GiftedChat } from "react-native-gifted-chat";

import { Appbar } from "react-native-paper";

import { useContactIdStore } from "../Contexts";
import { getMessages } from "../storage/DataHandlers";
import styles from "../Styles";
import { ChatRoomsStackChatScreenPropsType } from "../Types";

function ChatScreen({ navigation }: ChatRoomsStackChatScreenPropsType) {
  // const messages = useMessagesStore((state) => state.messages);
  // const setMessages = useMessagesStore((state) => state.setMessages);
  const [messages, setMessages] = React.useState([]);
  const contactId = useContactIdStore((state) => state.contactId);

  React.useEffect(() => {
    (async () => {
      const messagesFromStorage = await getMessages(contactId);
      const userFromStorage = await getContact(contactId);
      setMessages(await getMessages(contactId));
    })();
  }, []);

  const onSend = React.useCallback((messages = []) => {
    setMessages((previousMessages) => GiftedChat.append(previousMessages, messages));
  }, []);

  const inverted = false;
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
