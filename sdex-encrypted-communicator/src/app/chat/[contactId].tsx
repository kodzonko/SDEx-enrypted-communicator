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
import logger from "../../Logger";
import {
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
    const [firstPartyContact, setFirstPartyContact] = React.useState<Contact | undefined>(
        undefined,
    );
    const [bannerOfflineVisible, setBannerOfflineVisible] = React.useState<boolean>(false);
    const [thirdPartyOnline, setThirdPartyOnline] = React.useState<boolean>(false);

    const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);
    const newMessage = useMessagesBufferStore((state) => state.newMessage);
    const clearBuffer = useMessagesBufferStore((state) => state.clearBuffer);
    const sdexEngines = useCryptoContextStore((state) => state.sdexEngines);

    const params = useLocalSearchParams();
    const contactId = params.contactId !== undefined ? Number(params.contactId) : undefined;

    // Register with the server
    React.useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        requestRegister();
    }, []);

    // Check if third party is online - and repeat that check every 10 seconds
    // eslint-disable-next-line consistent-return
    React.useEffect(() => {
        if (contact?.publicKey) {
            const interval = setInterval(() => {
                // eslint-disable-next-line no-void
                void checkOnline(contact?.publicKey).then((online) => {
                    logger.info(
                        `[Chat.useEffect] Third party connected is to the server: ${JSON.stringify(
                            online,
                        )}.`,
                    );
                    setThirdPartyOnline(online);
                });
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [contact?.publicKey]);

    React.useEffect(() => {
        if (contactId) {
            // Get current contact info from the db
            (async () => {
                logger.info(
                    `[Chat.useEffect] Fetching contact info for contactId=${JSON.stringify(
                        contactId,
                    )}.`,
                );

                const fetchedContact = await getContactById(Number(contactId), sqlDbSession);
                if (!fetchedContact) {
                    logger.error(
                        `[Chat.useEffect] User with contactId=${JSON.stringify(
                            contactId,
                        )} not found in storage.`,
                    );
                } else {
                    setContact(fetchedContact);
                }

                const fetchedFirstPartyContact = await getContactById(0, sqlDbSession);
                if (!fetchedFirstPartyContact) {
                    logger.error(
                        `[Chat.useEffect] First party contact info not found in the database..`,
                    );
                } else {
                    setFirstPartyContact(fetchedFirstPartyContact);
                }
            })();
        }
    }, [contactId]);

    // initiate chat with the third party (exchange session key parts)
    React.useEffect(() => {
        logger.info("[Chat.useEffect] Attempting to initiate chat.");
        if (contact?.publicKey && sdexEngines.has(contact?.publicKey)) {
            logger.info(
                "[Chat.useEffect] Skipping chat initialization, user already has a session key for with that third party.",
            );
        } else if (
            socket.connected &&
            contact?.publicKey &&
            thirdPartyOnline &&
            !sdexEngines.has(contact.publicKey)
        ) {
            logger.info(`[Chat.useEffect] Sending "chatInit" message to ${contact.getFullName()}.`);
            // eslint-disable-next-line no-void
            void initiateChat(contact.publicKey);
        }
    }, [socket.connected, contact?.publicKey, thirdPartyOnline]);

    // Fetch archived messages from the db for the current contact
    // Mark all messages to and from that contact as read
    // Fill chat window with these messages
    React.useEffect(() => {
        if (contact && contact.id && firstPartyContact) {
            logger.info(`[Chat.useEffect] Fetching archived messages for contactId=${contact.id}.`);
            logger.info(
                `[Chat.useEffect] Marking messages to and from contactId=${contact.id} as read.`,
            );
            logger.info(
                `[Chat.useEffect] Filling chat window with archived messages for contactId=${contact.id}.`,
            );
            (async () => {
                const messagesFromStorage = await getMessagesByContactId(
                    Number(contactId),
                    sqlDbSession,
                );

                await markMessagesAsRead(contact.id as number, sqlDbSession);

                const giftedChatMessages: GiftedChatMessage[] = [];
                messagesFromStorage.forEach((message) => {
                    giftedChatMessages.push(
                        messageToGiftedChatMessage(message, contact, firstPartyContact),
                    );
                });
                setMessages(giftedChatMessages);
            })();
        }
    }, [contact, firstPartyContact]);

    // Show banner when offline
    React.useEffect(() => {
        if (!socket.connected || !thirdPartyOnline) {
            setBannerOfflineVisible(true);
        } else {
            setBannerOfflineVisible(false);
        }
    }, [thirdPartyOnline, socket.connected]);

    // Monitor new messages from the buffer
    // If message is from the current contact, re-fetch messages from the db to display it
    React.useEffect(() => {
        if (contact && firstPartyContact && newMessage?.contactIdFrom === contact.id) {
            logger.info(
                `[Chat.useEffect] New message appeared in a buffer. Fetching messages for contactId=${JSON.stringify(
                    contact.id,
                )}.`,
            );
            (async () => {
                const messagesFromStorage = await getMessagesByContactId(
                    Number(contactId),
                    sqlDbSession,
                );
                const giftedChatMessages: GiftedChatMessage[] = [];
                messagesFromStorage.forEach((message) => {
                    giftedChatMessages.push(
                        messageToGiftedChatMessage(message, contact, firstPartyContact),
                    );
                });
                setMessages(giftedChatMessages);
            })();
            // clearBuffer();
        }
    }, [newMessage, contact, firstPartyContact]);

    async function onSend(newMessages: GiftedChatMessage[] = []): Promise<void> {
        // Adding messages to chat window locally
        setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
        logger.info("[Chat.onSend] Message added to chat window locally.");
        // If possible, send messages to server
        // If that succeeds, save messages to database
        // So we keep persistent state in sync with what actually was sent to the server
        const thirdPartyCryptoEngine = sdexEngines.get(contact?.publicKey as string);
        if (
            contact &&
            socket.connected &&
            sqlDbSession &&
            thirdPartyCryptoEngine &&
            thirdPartyOnline
        ) {
            // Preconditions are met to encrypt and send messages to third party
            logger.info(
                "[Chat.onSend] Preconditions met. Encrypting and sending messages to third party.",
            );
            const results = [];
            // eslint-disable-next-line no-restricted-syntax
            for (const msg of newMessages) {
                const message = giftedChatMessageToMessage(msg, contact.id as number);
                logger.debug(`Sending message=${JSON.stringify(message)}`);
                results.push(
                    sendMessage(message, contact.publicKey, sqlDbSession, thirdPartyCryptoEngine),
                );
            }
            await Promise.all(results);
            logger.info(
                `[Chat.onSend] Message sent to server, received status: ${JSON.stringify(
                    results,
                )}.`,
            );
        } else {
            logger.error(
                "[Chat.onSend] Unable to send message to server. Some conditions are not met.",
            );
            logger.debug(
                `[Chat.onSend] contact: ${JSON.stringify(
                    Boolean(contact),
                )}, socket.connected: ${JSON.stringify(
                    socket.connected,
                )}, sdexEngine: ${JSON.stringify(
                    Boolean(thirdPartyCryptoEngine),
                )}, thirdPartyOnline: ${JSON.stringify(thirdPartyOnline)}`,
            );
        }
    }

    function determineBannerText(): string {
        let text = "";
        if (!socket.connected) {
            text =
                "Brak połączenia z serwerem. Aby wysyłać i odbierać wiadomości, połącz się z serwerem.";
        } else if (!thirdPartyOnline) {
            text =
                "Użytkownik jest offline. Możesz wysyłać wiadomości, ale nie ma gwarancji, że dotrą.";
        }
        return text;
    }

    function determineBannerActionLabel(): string {
        let text = "";
        if (!socket.connected) {
            text = "Połącz";
        } else if (!thirdPartyOnline) {
            text = "Okej";
        }
        return text;
    }

    // eslint-disable-next-line consistent-return
    function determineBannerAction(): void {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        let action = () => {};
        if (!socket.connected) {
            action = socketConnect;
        } else if (!thirdPartyOnline) {
            action = () => setBannerOfflineVisible(false);
        }
        return action();
    }

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
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onSend={(newMessages) => onSend(newMessages)}
                user={{
                    _id: 0,
                    name: firstPartyContact?.getFullName(),
                }}
            />
        </SafeAreaView>
    );
}
