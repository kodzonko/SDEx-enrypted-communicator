import * as React from "react";
import { SafeAreaView } from "react-native";
import { GiftedChat, IMessage as GiftedChatMessage } from "react-native-gifted-chat";

import { Appbar, Banner } from "react-native-paper";

import { Link, useLocalSearchParams } from "expo-router";
import { prepareToIngest } from "../../communication/PayloadComposers";
import socket, {
    checkKey,
    checkOnline,
    initiateChat,
    outsideChatRoomChatListener,
    requestRegister,
    sendMessage,
    socketConnect,
} from "../../communication/Sockets";
import { useCryptoContextStore } from "../../contexts/CryptoContext";
import { useSqlDbSessionStore } from "../../contexts/DbSession";
import logger from "../../Logger";
import {
    addMessage,
    getContactById,
    getContactByPublicKey,
    getMessagesByContactId,
    markMessagesAsRead,
} from "../../storage/DataHandlers";
import styles from "../../Styles";
import { Contact, TransportedMessage } from "../../Types";
import { giftedChatMessageToMessage, messageToGiftedChatMessage } from "../../utils/Converters";

export default function Chat() {
    const [messages, setMessages] = React.useState<GiftedChatMessage[]>([]);
    const [contact, setContact] = React.useState<Contact | undefined>(undefined);
    const [firstPartyContact, setFirstPartyContact] = React.useState<Contact | undefined>(
        undefined,
    );
    const [bannerOfflineVisible, setBannerOfflineVisible] = React.useState<boolean>(false);
    const [thirdPartyOnline, setThirdPartyOnline] = React.useState<boolean>(true);
    const [thirdPartyKeyRegistered, setThirdPartyKeyRegistered] = React.useState<boolean>(true);

    const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);
    const sdexEngines = useCryptoContextStore((state) => state.sdexEngines);

    const params = useLocalSearchParams();
    const contactId = params.contactId !== undefined ? Number(params.contactId) : undefined;

    // Register with the server
    React.useEffect(() => {
        logger.info(`[Chat.useEffect] Requesting registration with the server.`);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        requestRegister();
    }, []);

    // Get third party's contact info from the db
    React.useEffect(() => {
        if (contactId) {
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
            })();
        }
    }, [contactId, sqlDbSession]);

    // First party contact info from the db
    React.useEffect(() => {
        logger.info("[Chat.useEffect] Fetching contact info for first party contact.");
        (async () => {
            const fetchedFirstPartyContact = await getContactById(0, sqlDbSession);
            setFirstPartyContact(fetchedFirstPartyContact);
        })();
    }, [sqlDbSession]);

    // Swap chat event listener from "background" to "foreground"
    React.useEffect(() => {
        logger.info(
            '[Chat.useEffect] Swapping "chat" event listener from "background" to "foreground".',
        );
        socket.off("chat", outsideChatRoomChatListener);
        socket.on(
            "chat",
            async (
                message: TransportedMessage,
                callback: (response: boolean) => void,
            ): Promise<void> => {
                logger.info(
                    '[socket.on("chat", <foreground listener>)] Received "chat" event from server.',
                );
                logger.info(
                    '[socket.on("chat", <foreground listener>)] Getting context for SDEx engine.',
                );
                const sdexEngine = useCryptoContextStore
                    .getState()
                    .sdexEngines.get(message.publicKeyFrom);
                if (!sdexEngine) {
                    logger.error(
                        '[socket.on("chat", <foreground listener>)] Crypto context not found. Cannot decrypt message.',
                    );
                    callback(false);
                    return;
                }

                if (!sqlDbSession) {
                    logger.error(
                        '[socket.on("chat", <foreground listener>)] Database session not found. Cannot ingest a new message.',
                    );
                    callback(false);
                    return;
                }
                const contactFrom = await getContactByPublicKey(
                    message.publicKeyFrom,
                    sqlDbSession,
                );
                if (!contactFrom) {
                    logger.error(
                        '[socket.on("chat", <foreground listener>)] Contact not found. Cannot ingest a new message.',
                    );
                    callback(false);
                    return;
                }

                logger.info('[socket.on("chat", <foreground listener>)] Decrypting message.');
                logger.debug(
                    `[socket.on("chat", <foreground listener>)] Received message encrypted=${JSON.stringify(
                        message,
                    )}`,
                );
                logger.debug(
                    `[socket.on("chat", <foreground listener>)] SDEx engine=${JSON.stringify(
                        sdexEngine,
                    )}`,
                );
                const decryptedMessage = prepareToIngest(
                    message,
                    sdexEngine,
                    contactFrom.id as number, // if it's fetched from db we know it has an id
                );
                if (contactId === decryptedMessage.contactIdFrom) {
                    decryptedMessage.unread = false;
                }
                logger.debug(
                    `[socket.on("chat", <foreground listener>)] Decrypted message=${JSON.stringify(
                        decryptedMessage,
                    )}`,
                );

                addMessage(decryptedMessage, sqlDbSession)
                    .then(() => {
                        logger.info(
                            '[socket.on("chat", <foreground listener>)] Message ingested successfully.',
                        );
                        logger.debug(
                            `[socket.on("chat", <foreground listener>)] contact?.id=${JSON.stringify(
                                contact?.id,
                            )}, decryptedMessage.contactIdFrom=${decryptedMessage.contactIdFrom}`,
                        );

                        // If incoming message is from the current contact, add it to the chat window
                        if (
                            firstPartyContact &&
                            contact?.id &&
                            contactId === decryptedMessage.contactIdFrom
                        ) {
                            logger.info(
                                '[socket.on("chat", <foreground listener>)] Adding message to current chat window buffer.',
                            );

                            const giftedChatMessage = messageToGiftedChatMessage(
                                decryptedMessage,
                                contact,
                                firstPartyContact,
                            );
                            setMessages((previousMessages) =>
                                GiftedChat.append(previousMessages, [giftedChatMessage]),
                            );
                        }
                        callback(true);
                    })
                    .catch((error: Error) => {
                        logger.error(
                            `[socket.on("chat", <foreground listener>)] Error while ingesting message: ${error.message}`,
                        );
                        callback(false);
                    });
            },
        );

        return () => {
            logger.info(
                '[Chat.useEffect] Leaving chat window. Swapping "chat" event listener from "foreground" to "background".',
            );
            socket.removeAllListeners("chat");
            socket.on("chat", outsideChatRoomChatListener);
        };
    }, [firstPartyContact, contact, sqlDbSession, socket]);

    function runOnlineCheck(publicKey: string) {
        checkOnline(publicKey)
            .then((online) => {
                logger.info(
                    `[Chat.useEffect] Third party connected is to the server: ${JSON.stringify(
                        online,
                    )}.`,
                );
                setThirdPartyOnline(online);
            })
            .catch((error: Error) => {
                logger.error(
                    `[Chat.useEffect] Error while checking if third party is online: ${error.message}`,
                );
            });
    }

    // Check if third party is online - and repeat that check every 30 seconds
    // eslint-disable-next-line consistent-return
    React.useEffect(() => {
        if (contact?.publicKey) {
            runOnlineCheck(contact.publicKey);
            const interval = setInterval(() => {
                runOnlineCheck(contact.publicKey);
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [contact?.publicKey]);

    // Check if third party's key is registered on the server
    React.useEffect(() => {
        if (contact?.publicKey) {
            checkKey(contact.publicKey)
                .then((registered) => {
                    setThirdPartyKeyRegistered(registered);
                })
                .catch((error: Error) => {
                    logger.error(
                        `[Chat.useEffect] Error while checking if key is registered: ${error.message}`,
                    );
                });
        }
    }, [contact?.publicKey]);

    // Initiate chat with the third party (exchange session key parts)
    React.useEffect(() => {
        logger.info("[Chat.useEffect] Attempting to initiate chat.");
        if (contact?.publicKey && sdexEngines.has(contact?.publicKey)) {
            logger.info(
                "[Chat.useEffect] Skipping chat initialization, user already has a session key for that third party.",
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
                messagesFromStorage.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

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

    // Show banner when offline or third party's key is wrong
    React.useEffect(() => {
        if (!socket.connected || !thirdPartyOnline || !thirdPartyKeyRegistered) {
            setBannerOfflineVisible(true);
        } else {
            setBannerOfflineVisible(false);
        }
    }, [thirdPartyOnline, socket.connected, thirdPartyKeyRegistered]);

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
            const sendingJobs: Promise<boolean>[] = [];
            newMessages.forEach((msg) => {
                const messageConverted = giftedChatMessageToMessage(msg, contact.id as number);
                logger.debug(
                    `[Chat.onSend] Creating send job. Message=${JSON.stringify(messageConverted)}`,
                );
                sendingJobs.push(
                    sendMessage(
                        messageConverted,
                        contact.publicKey,
                        sqlDbSession,
                        thirdPartyCryptoEngine,
                    ),
                );
            });

            const sendingResults = await Promise.allSettled(sendingJobs);
            if (sendingResults.every((result) => result.status === "fulfilled")) {
                logger.info(
                    `[Chat.onSend] Messages sent to server, received status: ${JSON.stringify(
                        sendingResults,
                    )}.`,
                );
            } else
                logger.error(
                    `[Chat.onSend] Some messages failed to send to server, received status: ${JSON.stringify(
                        sendingResults,
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
        } else if (!thirdPartyKeyRegistered) {
            text =
                "Klucz publiczny użytkownika nie jest zarejestrowany na serwerze (prawdopodobnie jest nieprawidłowy).";
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
        } else if (!thirdPartyOnline || !thirdPartyKeyRegistered) {
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
