import * as React from "react";
import { Alert, SafeAreaView } from "react-native";
import { GiftedChat, IMessage as GiftedChatMessage } from "react-native-gifted-chat";

import { Appbar } from "react-native-paper";

import { Link, useLocalSearchParams } from "expo-router";
import { useSqlDbSessionStore } from "../../../contexts/DbSession";
import logger from "../../../Logger";
import { GENERIC_DB_MISSING_DATA_ERROR_MSG } from "../../../Messages";
import { getContactById, getMessagesByContactId } from "../../../storage/DataHandlers";
import styles from "../../../Styles";
import { Contact } from "../../../Types";
import { messageToGiftedChatMessage } from "../../../utils/Converters";

export default function Profile() {
  const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);
  const [messages, setMessages] = React.useState<GiftedChatMessage[]>([]);
  const [contact, setContact] = React.useState<Contact | undefined>(undefined);

  const params = useLocalSearchParams();
  const { contactId } = params;

  React.useEffect(() => {
    (async () => {
      // If contactID is -1, then user is creating a new contact.
      if (contactId && contactId !== "-1") {
        logger.info(`Fetching contact info for contactId=${JSON.stringify(contactId)}.`);
        setContact(await getContactById(Number(contactId), sqlDbSession));
        if (!contact) {
          logger.error(`User with id=${JSON.stringify(contactId)} not found in storage.`);
          Alert.alert(GENERIC_DB_MISSING_DATA_ERROR_MSG, "Użytkownik nie został znaleziony.");
        }
      }
    })();
  }, [contactId]);

  React.useEffect(() => {
    if (contact) {
      (async () => {
        const messagesFromStorage = await getMessagesByContactId(Number(contactId), sqlDbSession);
        const giftedChatMessages: GiftedChatMessage[] = [];
        messagesFromStorage.forEach((message) => {
          giftedChatMessages.push(messageToGiftedChatMessage(message, contact));
        });
        setMessages(giftedChatMessages);
      })();
    }
  }, [contact]);

  const onSend = React.useCallback((newMessages: GiftedChatMessage[] = []) => {
    setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
  }, []);

  // const { width, height } = Dimensions.get("window");

  return (
    <SafeAreaView className="flex-1">
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content
          title={contact ? contact.getFullName() : "<name>"}
          titleStyle={styles.appBarTitle}
        />
        <Link href="/chat-rooms" asChild>
          <Appbar.BackAction iconColor={styles.appBarIcons.color} />
        </Link>
      </Appbar.Header>
      <GiftedChat
        messages={messages}
        textInputProps={{ autoFocus: true }}
        onSend={(newMessages) => onSend(newMessages)}
        user={{
          _id: 0,
          name: "Ty",
        }}
      />
    </SafeAreaView>
  );
}
