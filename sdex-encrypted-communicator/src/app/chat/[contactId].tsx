import * as React from "react";
import { SafeAreaView } from "react-native";
import { GiftedChat, IMessage as GiftedChatMessage } from "react-native-gifted-chat";

import { Appbar, Banner } from "react-native-paper";

import { Link, useLocalSearchParams } from "expo-router";
import socket, {
  checkOnline,
  initializeChat,
  requestRegister,
  sendMessage,
  socketConnect,
} from "../../communication/Sockets";
import { useSqlDbSessionStore } from "../../contexts/DbSession";
import { useMessagesBufferStore } from "../../contexts/MessagesBuffer";
import { useServerStore } from "../../contexts/Server";
import { chooseSdexCryptoContext } from "../../crypto/cryptoHelpers";
import SdexCrypto from "../../crypto/SdexCrypto";
import logger from "../../Logger";
import {
  addMessage,
  getContactById,
  getMessagesByContactId,
  markMessagesAsRead,
} from "../../storage/DataHandlers";
import styles from "../../Styles";
import { Contact } from "../../Types";
import { giftedChatMessageToMessage, messageToGiftedChatMessage } from "../../utils/Converters";

export default function Chat() {
  const [messages, setMessages] = React.useState<GiftedChatMessage[]>([]);
  const [contact, setContact] = React.useState<Contact | undefined>(undefined);
  const [firstPartyContact, setFirstPartyContact] = React.useState<Contact | undefined>(undefined);
  const [bannerOfflineVisible, setBannerOfflineVisible] = React.useState<boolean>(false);
  const [sdexEngineOut, setSdexEngineOut] = React.useState<SdexCrypto | undefined>(undefined);

  const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);
  const newMessage = useMessagesBufferStore((state) => state.newMessage);
  const clearBuffer = useMessagesBufferStore((state) => state.clearBuffer);
  const isRegistered = useServerStore((state) => state.isRegistered);
  const [thirdPartyOnline, setThirdPartyOnline] = React.useState<boolean>(false);

  const params = useLocalSearchParams();
  const { contactId } = params;

  React.useEffect(() => {
    requestRegister();
  }, []);

  React.useEffect(() => {
    if (contact) {
      (async () => {
        await initializeChat(contact.publicKey);
      })();
    }
  }, [socket.connected, contact]);

  React.useEffect(() => {
    // Get current contact info from the db
    (async () => {
      if (contactId) {
        logger.info(`Fetching contact info for contactId=${JSON.stringify(contactId)}.`);

        const fetchedContact = await getContactById(Number(contactId), sqlDbSession);
        if (!fetchedContact) {
          logger.error(`User with contactId=${JSON.stringify(contactId)} not found in storage.`);
        } else {
          setContact(fetchedContact);
        }

        const fetchedFirstPartyContact = await getContactById(0, sqlDbSession);
        if (!fetchedFirstPartyContact) {
          logger.error(`First party contact info not found in the database..`);
        } else {
          setFirstPartyContact(fetchedFirstPartyContact);
        }
      }
    })();
  }, [contactId]);

  React.useEffect(() => {
    // Check if user is online
    if (contact?.publicKey) {
      const status = checkOnline(contact.publicKey);
      logger.info(`User ${contact.getFullName()} is online.`);
      setThirdPartyOnline(status);
    }
  }, [socket.connected, isRegistered, contact?.publicKey]);

  React.useEffect(() => {
    // Fetch archived messages from the db for the current contact
    if (contact && firstPartyContact) {
      (async () => {
        const messagesFromStorage = await getMessagesByContactId(Number(contactId), sqlDbSession);

        await markMessagesAsRead(messagesFromStorage, sqlDbSession);

        const giftedChatMessages: GiftedChatMessage[] = [];
        messagesFromStorage.forEach((message) => {
          giftedChatMessages.push(messageToGiftedChatMessage(message, contact, firstPartyContact));
        });
        setMessages(giftedChatMessages);
      })();
    }
  }, [contact, firstPartyContact]);

  // Show banner when offline
  // When online, initialize chat (exchange SDEX cryptography context)
  React.useEffect(() => {
    if (!socket.connected) {
      setBannerOfflineVisible(true);
    } else if (!isRegistered) {
      setBannerOfflineVisible(true);
    } else {
      setBannerOfflineVisible(false);
    }
  }, [contact, socket.connected, isRegistered]);

  React.useEffect(() => {
    // Monitor new messages from the buffer
    // If message is from the current contact, re-fetch messages from the db to display it
    if (contact && newMessage?.contactIdFrom === contact.id && firstPartyContact) {
      (async () => {
        const messagesFromStorage = await getMessagesByContactId(Number(contactId), sqlDbSession);
        const giftedChatMessages: GiftedChatMessage[] = [];
        messagesFromStorage.forEach((message) => {
          giftedChatMessages.push(messageToGiftedChatMessage(message, contact, firstPartyContact));
        });
        setMessages(giftedChatMessages);
      })();
      clearBuffer();
    }
  }, [newMessage, contact, firstPartyContact]);

  React.useEffect(() => {
    if (firstPartyContact && contact) {
      const context = chooseSdexCryptoContext(firstPartyContact.publicKey, contact.publicKey);
      const engine = new SdexCrypto(
        context.initializationHash,
        context.hashFromUserPassword,
        context.sessionKey,
      );
      setSdexEngineOut(engine);
    }
  }, [firstPartyContact, contact]);

  const onSend = React.useCallback(
    (newMessages: GiftedChatMessage[] = []) => {
      // Adding messages to chat window locally
      setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
      // If possible, send messages to server
      // If that succeeds, save messages to database
      // So we keep persistent state in sync with what actually was sent to the server
      if (
        !contact ||
        !contact.id ||
        socket.disconnected ||
        !isRegistered ||
        !sqlDbSession ||
        !sdexEngineOut
      ) {
        logger.error("Unable to send message to server. Some conditions are not met.");
        logger.debug(
          `contact=${JSON.stringify(contact)}, socket.disconnected=${JSON.stringify(
            socket.disconnected,
          )}, isRegistered=${JSON.stringify(isRegistered)}`,
        );
        return;
      }
      newMessages.forEach((msg) => {
        const message = giftedChatMessageToMessage(msg, contact.id as number);
        (async () => {
          await sendMessage(message, contact.publicKey, sqlDbSession, sdexEngineOut);
        })();
      });
    },
    [
      contact,
      socket.disconnected,
      isRegistered,
      giftedChatMessageToMessage,
      addMessage,
      sqlDbSession,
      sdexEngineOut,
      sendMessage,
    ],
  );

  const determineBannerText = (): string => {
    if (!socket.connected) {
      return "Brak połączenia z serwerem. Aby wysyłać i odbierać wiadomości, połącz się z serwerem.";
    }
    if (!isRegistered) {
      return "Nie jesteś uwierzytelniony. Masz połączenie z serwerem, ale nie zostałeś na nim uwierzytelniony. Autoryzuj się, aby móc wysyłać i odbierać wiadomości.";
    }
    if (!thirdPartyOnline) {
      return "Użytkownik jest offline. Możesz wysyłać wiadomości, ale nie ma gwarancji, że dotrą.";
    }
    return "";
  };

  const determineBannerActionLabel = (): string => {
    if (!socket.connected) {
      return "Połącz";
    }
    if (!isRegistered) {
      return "Autoryzuj";
    }
    if (!thirdPartyOnline) {
      return "Okej";
    }
    return "";
  };

  // eslint-disable-next-line consistent-return
  const determineBannerAction = (): void => {
    if (!socket.connected) {
      return socketConnect();
    }
    if (!isRegistered) {
      return requestRegister();
    }
    if (!thirdPartyOnline) {
      return setBannerOfflineVisible(false);
    }
  };

  // const { width, height } = Dimensions.get("window");

  return (
    <SafeAreaView className="flex-1">
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content
          title={contact ? contact.getFullName() : "<name>"}
          titleStyle={styles.appBarTitle}
        />
        <Link href="/chats" asChild>
          <Appbar.BackAction iconColor={styles.appBarIcons.color} />
        </Link>
      </Appbar.Header>
      <Banner
        visible={bannerOfflineVisible}
        icon="connection"
        actions={[
          {
            label: determineBannerActionLabel(),
            onPress: determineBannerAction,
          },
        ]}
      >
        {determineBannerText()}
      </Banner>
      <GiftedChat
        messages={messages}
        textInputProps={{ autoFocus: true }}
        onSend={(newMessages) => onSend(newMessages)}
        user={{
          _id: 0,
          name: firstPartyContact?.getFullName(),
        }}
      />
    </SafeAreaView>
  );
}
