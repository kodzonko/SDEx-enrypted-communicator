import * as React from "react";
import { SafeAreaView } from "react-native";
import { GiftedChat, IMessage as GiftedChatMessage } from "react-native-gifted-chat";

import { Appbar, Banner } from "react-native-paper";

import { Link, useLocalSearchParams } from "expo-router";
import socket, {
  checkOnline,
  initiateChat,
  requestRegister,
  sendMessage,
  socketConnect,
} from "../../communication/Sockets";
import { useCryptoContextStore } from "../../contexts/CryptoContext";
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
  const [thirdPartyOnline, setThirdPartyOnline] = React.useState<boolean>(false);

  const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);
  const newMessage = useMessagesBufferStore((state) => state.newMessage);
  const clearBuffer = useMessagesBufferStore((state) => state.clearBuffer);
  const isRegistered = useServerStore((state) => state.isRegistered);
  const firstPartyCryptoContext = useCryptoContextStore((state) => state.firstPartyCryptoContext);
  const thirdPartyCryptoContexts = useCryptoContextStore(
    (state) => state.thirdPartyCryptoContextsMap,
  );

  const params = useLocalSearchParams();
  const { contactId } = params;

  React.useEffect(() => {
    requestRegister();
  }, []);

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

  // Check if user is online
  // If online set his online status and send chatInit message
  React.useEffect(() => {
    if (socket.connected && contact?.publicKey && isRegistered) {
      logger.info(`Checking if user ${contact.getFullName()} is online.`);
      const status = checkOnline(contact.publicKey);
      if (status) {
        logger.info(`User ${contact.getFullName()} is online.`);
      } else {
        logger.info(`User ${contact.getFullName()} is offline.`);
      }
    }
  }, [socket.connected, isRegistered, contact?.publicKey]);

  // If user is online, send chatInit message
  React.useEffect(() => {
    if (thirdPartyOnline && contact) {
      logger.info(`Sending chatInit message to ${contact.getFullName()}.`);
      (async () => {
        await initiateChat(contact.publicKey);
      })();
    }
  }, [thirdPartyOnline, contact]);

  // Fetch archived messages from the db for the current contact
  // Mark all messages to and from that contact as read
  // Fill chat window with these messages
  React.useEffect(() => {
    if (contact && contact.id && firstPartyContact) {
      logger.info(`Fetching archived messages for contactId=${contact.id}.`);
      logger.info(`Marking messages to and from contactId=${contact.id} as read.`);
      logger.info(`Filling chat window with archived messages for contactId=${contact.id}.`);
      (async () => {
        const messagesFromStorage = await getMessagesByContactId(Number(contactId), sqlDbSession);

        await markMessagesAsRead(contact.id as number, sqlDbSession);

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

  // Monitor new messages from the buffer
  // If message is from the current contact, re-fetch messages from the db to display it
  React.useEffect(() => {
    if (contact && newMessage?.contactIdFrom === contact.id && firstPartyContact) {
      logger.info(
        `New message appeared in a buffer. Fetching archived messages for contactId=${JSON.stringify(
          contact.id,
        )}.`,
      );
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

  // Initialize SDEX crypto engine for outgoing messages encryption
  React.useEffect(() => {
    let thirdPartyCryptoContext;
    if (contact) {
      thirdPartyCryptoContext = thirdPartyCryptoContexts.get(contact.publicKey);
    }
    if (firstPartyContact && contact && firstPartyCryptoContext && thirdPartyCryptoContext) {
      logger.info(
        "Choosing crypto context and initializing SDEX engine for outgoing messages encryption.",
      );
      const context = chooseSdexCryptoContext(
        firstPartyContact.publicKey,
        firstPartyCryptoContext,
        thirdPartyCryptoContext,
      );
      const engine = new SdexCrypto(
        context.initializationHash,
        context.hashFromUserPassword,
        context.sessionKey,
      );
      setSdexEngineOut(engine);
    }
  }, [firstPartyContact, contact, firstPartyCryptoContext, thirdPartyCryptoContexts]);

  const onSend = React.useCallback(
    (newMessages: GiftedChatMessage[] = []) => {
      // Adding messages to chat window locally
      setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
      logger.info("Message added to chat window locally.");
      // If possible, send messages to server
      // If that succeeds, save messages to database
      // So we keep persistent state in sync with what actually was sent to the server
      if (
        !contact ||
        !contact.id ||
        socket.disconnected ||
        !isRegistered ||
        !sqlDbSession ||
        !sdexEngineOut ||
        !thirdPartyOnline
      ) {
        logger.error("Unable to send message to server. Some conditions are not met.");
        logger.debug(
          `contact=${JSON.stringify(contact)}, socket.disconnected=${JSON.stringify(
            socket.disconnected,
          )}, isRegistered=${JSON.stringify(
            isRegistered,
          )}, sdexEngineOutUndefined?=${JSON.stringify(
            sdexEngineOut === undefined,
          )}, thirdPartyOnline=${JSON.stringify(thirdPartyOnline)}`,
        );
      } else {
        // Preconditions are met to encrypt and send messages to third party
        newMessages.forEach((msg) => {
          const message = giftedChatMessageToMessage(msg, contact.id as number);
          (async () => {
            await sendMessage(message, contact.publicKey, sqlDbSession, sdexEngineOut);
          })();
        });
      }
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
      thirdPartyOnline,
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
