import { WebSQLDatabase } from "expo-sqlite";
import Toast from "react-native-root-toast";
import { io, Socket } from "socket.io-client";
import { useCryptoContextStore } from "../contexts/CryptoContext";
import { useSqlDbSessionStore } from "../contexts/DbSession";
import { generateSessionKeyPart } from "../crypto/CryptoHelpers";
import { decryptRsa, encryptRsa, signRsa } from "../crypto/RsaCrypto";
import SdexCrypto from "../crypto/SdexCrypto";
import { CommunicationError, PreconditionError } from "../Errors";
import logger from "../Logger";
import { addMessage, getContactByPublicKey } from "../storage/DataHandlers";
import { mmkvStorage } from "../storage/MmkvStorageMiddlewares";
import {
    ChatInitPayload,
    ClientToServerEvents,
    Message,
    RegisterFollowUpPayload,
    ServerToClientEvents,
    TransportedMessage,
} from "../Types";
import { bytesToString, mergeUint8Arrays, stringToBytes } from "../utils/Converters";
import { prepareToIngest, prepareToSend } from "./PayloadComposers";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
    process.env.SERVER_WEBSOCKET_URL as string,
    {
        path: "/ws/socket.io/",
        autoConnect: true,
        auth: { publicKey: mmkvStorage.getString("publicKey") },
        rejectUnauthorized: false,
        transports: ["websocket"],
    },
);

async function requestChallengeVerification(payload: RegisterFollowUpPayload): Promise<boolean> {
    try {
        const registrationStatus = await socket.emitWithAck("registerFollowUp", payload);
        logger.info("[requestChallengeVerification] Register response received from server.");
        if (registrationStatus === "success") {
            logger.info("[requestChallengeVerification] Successfully registered on the server.");
            return true;
        }
        logger.error("[requestChallengeVerification] Failed to register on the server.");
        return false;
    } catch (error) {
        logger.error(
            `[requestChallengeVerification] registerFollowUp error=${JSON.stringify(error)}`,
        );
        return false;
    }
}

export async function requestRegister(): Promise<boolean> {
    logger.info('[requestRegister] Emitting "registerInit" event to server.');
    const publicKey = mmkvStorage.getString("publicKey");
    if (!publicKey) {
        throw new PreconditionError(
            "[requestRegister] Public key not found. Cannot register client on server.",
        );
    }
    const privateKey = mmkvStorage.getString("privateKey");
    if (!privateKey) {
        throw new PreconditionError(
            "[requestRegister] Private key not found. Cannot register client on server.",
        );
    }
    const login = mmkvStorage.getString("login");
    if (!login) {
        throw new PreconditionError(
            "[requestRegister] Login not found. Cannot register client on server.",
        );
    }
    try {
        const challenge = await socket.emitWithAck("registerInit");
        logger.debug(
            `[requestRegister] Challenge received from server: ${JSON.stringify(challenge)}.`,
        );
        if (!challenge) {
            throw new CommunicationError("[requestRegister] Challenge not received from server.");
        }
        if (challenge === "already authenticated") {
            logger.info("[requestRegister] Already authenticated. Skipping registration.");
            return true;
        }
        const signature = await signRsa(privateKey, challenge);
        logger.debug(`[requestRegister] Signature: ${signature}`);

        const payload: RegisterFollowUpPayload = {
            login,
            publicKey,
            signature,
        };
        logger.debug(
            `[requestRegister] Payload prepared to send to server: ${JSON.stringify(payload)}.`,
        );
        const registrationSuccessful = await requestChallengeVerification(payload);
        if (!registrationSuccessful) {
            Toast.show("Nie udało się zarejestrować na serwerze.", {
                duration: Toast.durations.SHORT,
            });
        }
        return registrationSuccessful;
    } catch (error) {
        logger.error(`[requestRegister] "registerInit" error=${JSON.stringify(error)}`);
        return false;
    }
}

export function socketConnect(): void {
    logger.info("[socketConnect] Connecting to the backend server with websocket connection.");
    socket.connect();
}

socket.on("connect", (): void => {
    logger.info("[socketConnect] Connected to the backend server with websocket connection.");
    logger.debug(
        `[socketConnect] Server address: ${JSON.stringify(process.env.SERVER_WEBSOCKET_URL)}.`,
    );
    Toast.show("Połączono z serwerem.", {
        duration: Toast.durations.SHORT,
    });
});

socket.on("disconnect", (reason, description): void => {
    logger.info(
        `[socket.on("disconnect")] Disconnected from server. Reason: ${reason}, description: ${JSON.stringify(
            description,
        )}`,
    );
    Toast.show("Utracono połączenie z serwerem", {
        duration: Toast.durations.SHORT,
    });
});

// socket.on("connect_error", (error) => {
//   logger.error(`Connection error=${JSON.stringify(error.message)}`);
// });

/**
 * Function handling actual sending of a message to the server.
 */
async function executeSendMessage(
    transportedMessage: TransportedMessage,
    message: Message,
    sqlDbSession: WebSQLDatabase,
): Promise<boolean> {
    logger.info(`[executeSendMessage] Emitting "chat" event.`);
    try {
        const response = await socket.emitWithAck("chat", transportedMessage);
        if (response === "success") {
            logger.info("[executeSendMessage] Message delivered successfully.");
            logger.info("[executeSendMessage] Saving delivered message to the local database.");
            try {
                await addMessage(message, sqlDbSession);
                return true;
            } catch (error) {
                logger.error(
                    `[executeSendMessage] Failed to save message to the local database. Error=${JSON.stringify(
                        error,
                    )}`,
                );
                return false;
            }
        } else {
            logger.error(
                "[executeSendMessage] Failed to deliver a message. Not saving it to the local database.",
            );
            return false;
        }
    } catch (error) {
        logger.error(
            `[executeSendMessage] "chat" emitting error. Didn't receive confirmation. Error=${JSON.stringify(
                error,
            )}`,
        );
        return false;
    }
}

/**
 * Function coordinating preparation steps before and after sending message to the server.
 *
 * Handles encryption, serialization and - after sending - writing a message to the database.
 * @param message Raw message object.
 * @param sqlDbSession An open connection to local SQL database to save message in.
 */
export async function sendMessage(
    message: Message,
    publicKeyTo: string,
    sqlDbSession: WebSQLDatabase,
    sdexEngine: SdexCrypto,
): Promise<boolean> {
    logger.info("[sendMessage] Sending a message.");
    logger.debug(
        `[sendMessage] Message details: ${JSON.stringify(message)}, publicKeyTo: ${publicKeyTo}`,
    );
    const publicKeyFrom = mmkvStorage.getString("publicKey");
    if (!publicKeyFrom) {
        logger.error(
            "[sendMessage] Sender's or receiver's public key not found. Cannot send a message.",
        );
        logger.debug(
            `[sendMessage] publicKeyFrom=${JSON.stringify(
                publicKeyFrom,
            )}, publicKeyTo=${JSON.stringify(publicKeyTo)}`,
        );
        throw new PreconditionError(
            "[sendMessage] First party's key(s) not found. Cannot send message.",
        );
    }
    const transportReadyMessage: TransportedMessage = await prepareToSend(
        message,
        publicKeyFrom,
        publicKeyTo,
        sdexEngine,
    );
    logger.info(`[sendMessage] Emitting "chat" event.`);
    logger.debug(`[sendMessage] Transport ready message=${JSON.stringify(transportReadyMessage)}`);
    logger.debug(`[sendMessage] SDEx engine=${JSON.stringify(sdexEngine)}`);
    const successfulSend = await executeSendMessage(transportReadyMessage, message, sqlDbSession);
    if (successfulSend) {
        logger.info("[sendMessage] Message sent successfully.");
        return true;
    }
    logger.error("[sendMessage] Failed to send a message.");
    return false;
}

socket.on(
    "chatInit",
    async (
        data: ChatInitPayload,
        callback: (sessionKeyPart: string | null) => void,
    ): Promise<void> => {
        logger.info('[socket.on("chatInit")] Received "chatInit" event from server.');

        const firstPartyPublicKey = mmkvStorage.getString("publicKey");
        const firstPartyPrivateKey = mmkvStorage.getString("privateKey");
        if (!firstPartyPublicKey || !firstPartyPrivateKey) {
            throw new PreconditionError('[socket.on("chatInit")] Missing first party key pair.');
        }

        if (data.publicKeyTo !== firstPartyPublicKey) {
            logger.error(
                "[socket.on(\"chatInit\")] Received public key doesn't match first party's actual public key.",
            );
            callback(null);
            return;
        }

        const thirdPartyContext = useCryptoContextStore
            .getState()
            .sdexEngines.get(data.publicKeyFrom);
        if (thirdPartyContext) {
            logger.info(
                '[socket.on("chatInit")] Third party crypto context already exists. Updating it.',
            );
        } else {
            logger.info(
                '[socket.on("chatInit")] Third party crypto context for that contact doesn\'t exist. Creating it.',
            );
        }

        logger.info('[socket.on("chatInit")] Decrypting third party\'s part of session key.');
        logger.debug(
            `[socket.on("chatInit")] Session key first part encrypted as received=${data.sessionKeyPartEncrypted}`,
        );
        const sessionKeyFirstPartString = await decryptRsa(
            firstPartyPrivateKey,
            data.sessionKeyPartEncrypted,
        );
        logger.debug(
            `[socket.on("chatInit")] Session key first part decrypted as string=${sessionKeyFirstPartString}`,
        );
        const sessionKeyFirstPart = stringToBytes(sessionKeyFirstPartString);
        logger.debug(
            `[socket.on("chatInit")] Session key first part decrypted=${JSON.stringify(
                sessionKeyFirstPart,
            )}`,
        );

        // Generating a second part of the session key of equal length to the 1st half
        const sessionKeySecondPart = generateSessionKeyPart(sessionKeyFirstPart.length);
        logger.debug(
            `[socket.on("chatInit")] Session key second part=${JSON.stringify(
                sessionKeySecondPart,
            )}`,
        );
        logger.info('[socket.on("chatInit")] Encrypting 2nd part of the session key.');
        const sessionKeySecondPartEncrypted = await encryptRsa(
            data.publicKeyFrom,
            bytesToString(sessionKeySecondPart),
        );
        logger.debug(
            `[socket.on("chatInit")] Session key second part encrypted=${sessionKeySecondPartEncrypted}`,
        );
        const sessionKey = mergeUint8Arrays(sessionKeyFirstPart, sessionKeySecondPart);
        logger.debug(`[socket.on("chatInit")] Session key=${JSON.stringify(sessionKey)}`);
        const sdexEngine = new SdexCrypto(sessionKey);
        logger.info('[socket.on("chatInit")] Saving sdex crypto engine in store.');
        useCryptoContextStore.getState().addUserEngine(data.publicKeyFrom, sdexEngine);

        // Returning only the second part of the key to the server, not the whole session key!
        logger.info(
            '[socket.on("chatInit")] Returning encrypted second part of the key back to the server in callback.',
        );
        callback(sessionKeySecondPartEncrypted);
    },
);

/**
 * Send first party's crypto context needed for SDEx decryption of their messages
 * @param publicKeyTo Receiver's public key
 * @returns true if the request was successful (on both ends), false otherwise
 */
export async function initiateChat(publicKeyTo: string): Promise<boolean> {
    logger.info("[initiateChat] Initiating chat.");
    const existingSessionKey = useCryptoContextStore.getState().sdexEngines.has(publicKeyTo);
    if (existingSessionKey) {
        logger.info(
            "[initiateChat] Session key for this third party already exists. Skipping request.",
        );
        return true;
    }
    logger.info("[initiateChat] No existing session key found. Sending a request.");

    const firstPartyPublicKey = mmkvStorage.getString("publicKey");
    const firstPartyPrivateKey = mmkvStorage.getString("privateKey");

    // Checking preconditions
    if (!firstPartyPublicKey || !firstPartyPrivateKey) {
        logger.debug(
            `[initiateChat] First party public key=${JSON.stringify(
                firstPartyPublicKey,
            )}, first party private key=${JSON.stringify(firstPartyPrivateKey)}`,
        );
        throw new PreconditionError("First party's key(s) not found. Cannot initiate chat.");
    }

    logger.debug(
        `[initiateChat] Sender's public key=${firstPartyPublicKey}. Receiver's public key=${publicKeyTo}`,
    );

    // Session key for this contact doesn't exist yet. Generating first part of it.
    const sessionKeyFirstPart = generateSessionKeyPart();
    logger.debug(`[initiateChat] Session key first part=${JSON.stringify(sessionKeyFirstPart)}`);
    logger.debug(
        `[initiateChat] Session key first part as string=${bytesToString(sessionKeyFirstPart)}`,
    );

    logger.info("[initiateChat] (RSA) Encrypting first part of session key before sending.");
    const sessionKeyFirstPartEncrypted = await encryptRsa(
        publicKeyTo,
        bytesToString(sessionKeyFirstPart),
    );
    logger.debug(`[initiateChat] Session key first part encrypted=${sessionKeyFirstPartEncrypted}`);

    logger.info('[initiateChat] Emitting "chatInit" event.');
    try {
        const response = await socket.emitWithAck("chatInit", {
            publicKeyFrom: firstPartyPublicKey,
            publicKeyTo,
            sessionKeyPartEncrypted: sessionKeyFirstPartEncrypted,
        });
        logger.debug(`[initiateChat] "chatInit" response=${JSON.stringify(response)}`);
        if (!response) {
            logger.error("[initiateChat] chatInit response from server is undefined.");
            return false;
        }
        try {
            const sessionKeySecondPartString = await decryptRsa(firstPartyPrivateKey, response);
            logger.debug(
                `[initiateChat] Decrypted session key second part as string=${sessionKeySecondPartString}`,
            );
            const sessionKeySecondPart = stringToBytes(sessionKeySecondPartString);
            logger.debug(
                `[initiateChat] Decrypted session key second part=${JSON.stringify(
                    sessionKeySecondPart,
                )}`,
            );
            const sessionKey = mergeUint8Arrays(sessionKeyFirstPart, sessionKeySecondPart);
            logger.debug(`[initiateChat] Session key=${JSON.stringify(sessionKey)}`);

            logger.info(
                "[initiateChat] Saving generated session to third party crypto context mapping.",
            );
            const sdexEngine = new SdexCrypto(sessionKey);
            useCryptoContextStore.getState().addUserEngine(publicKeyTo, sdexEngine);

            return true;
        } catch (error) {
            logger.error(
                "[initiateChat] Failed to decrypt session key part received from the third party.",
            );
            logger.debug(`[initiateChat] Error=${JSON.stringify(error)}`);
            return false;
        }
    } catch (error) {
        logger.error(`[initiateChat] "chatInit" error=${JSON.stringify(error)}`);
        return false;
    }
}

socket.on(
    "chat",
    async (message: TransportedMessage, callback: (response: boolean) => void): Promise<void> => {
        logger.info('[socket.on("chat")] Received "chat" event from server.');
        logger.info('[socket.on("chat")] Getting context for SDEx engine.');
        const sdexEngine = useCryptoContextStore.getState().sdexEngines.get(message.publicKeyFrom);
        if (!sdexEngine) {
            logger.error('[socket.on("chat")] Crypto context not found. Cannot decrypt message.');
            callback(false);
            return;
        }

        const firstPartyPrivateKey = mmkvStorage.getString("privateKey");
        if (!firstPartyPrivateKey) {
            logger.error(
                '[socket.on("chat")] First party private key not found. Cannot decrypt message.',
            );
            callback(false);
            return;
        }

        const { sqlDbSession } = useSqlDbSessionStore.getState();
        if (!sqlDbSession) {
            logger.error(
                '[socket.on("chat")] Database session not found. Cannot ingest a new message.',
            );
            callback(false);
            return;
        }
        const contactFrom = await getContactByPublicKey(message.publicKeyFrom, sqlDbSession);
        if (!contactFrom) {
            logger.error('[socket.on("chat")] Contact not found. Cannot ingest a new message.');
            callback(false);
            return;
        }

        logger.info('[socket.on("chat")] Decrypting message.');
        logger.debug(`[socket.on("chat")] Received message encrypted=${JSON.stringify(message)}`);
        logger.debug(`[socket.on("chat")] SDEx engine=${JSON.stringify(sdexEngine)}`);
        const decryptedMessage = await prepareToIngest(
            message,
            sdexEngine,
            firstPartyPrivateKey,
            contactFrom.id as number, // if it's fetched from db we know it has an id
        );
        logger.debug(`[socket.on("chat")] Decrypted message=${JSON.stringify(decryptedMessage)}`);

        // await addMessage(decryptedMessage, sqlDbSession);
        logger.info('[socket.on("chat")] Message ingested successfully.');
        logger.info('[socket.on("chat")] Adding message to the buffer.');
        // useMessagesBufferStore.getState().addNewMessage(decryptedMessage);
        callback(true);
    },
);

/**
 * Check whether a public key is registered on the server.
 * This doesn't mean that a third party is currently online,
 * but if he isn't registered, it means he never before registered to the server with this public key.
 * @param publicKey public key to verify
 * @returns true if public key is registered on the server, false otherwise
 */
export async function checkKey(publicKey: string): Promise<boolean> {
    logger.info('[checkKey] Sending "checkKey" event to server.');
    try {
        const response = await socket.emitWithAck("checkKey", { publicKey });
        logger.debug(`[checkKey] Response from server=${JSON.stringify(response)}.`);
        return response;
    } catch (error) {
        logger.error(`[checkKey] checkKey event error=${JSON.stringify(error)}`);
        return false;
    }
}

/**
 * Check whether a user with provided public key is connected on the server.
 * @param publicKey public key of the user to look up
 * @returns true if public key is registered on the server, false otherwise
 */
export async function checkOnline(publicKey: string): Promise<boolean> {
    logger.info('[checkOnline] Sending "checkOnline" event to server.');
    try {
        const response = await socket.emitWithAck("checkOnline", { publicKey });
        logger.debug(`[checkOnline] Response from server=${JSON.stringify(response)}.`);
        return response;
    } catch (error) {
        logger.error(`[checkOnline] Error=${JSON.stringify(error)}`);
        return false;
    }
}

export default socket;
