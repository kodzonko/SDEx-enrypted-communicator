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
        const registrationStatus = await socket
            .timeout(10000)
            .emitWithAck("registerFollowUp", payload);
        logger.info("Register response received from server.");
        if (registrationStatus === "success") {
            logger.info("Successfully registered on the server.");
            return true;
        }
        logger.error("Failed to register on the server.");
        return false;
    } catch (error) {
        logger.error(`registerFollowUp error=${JSON.stringify(error)}`);
        return false;
    }
}

export async function requestRegister(): Promise<boolean> {
    logger.info('Emitting "registerInit" event to server.');
    const publicKey = mmkvStorage.getString("publicKey");
    if (!publicKey) {
        throw new PreconditionError("Public key not found. Cannot register client on server.");
    }
    const privateKey = mmkvStorage.getString("privateKey");
    if (!privateKey) {
        throw new PreconditionError("Private key not found. Cannot register client on server.");
    }
    const login = mmkvStorage.getString("login");
    if (!login) {
        throw new PreconditionError("Login not found. Cannot register client on server.");
    }
    try {
        const challenge = await socket.timeout(10000).emitWithAck("registerInit");
        logger.info("Register request sent to the server.");
        logger.debug(`Challenge received from server: ${JSON.stringify(challenge)}.`);
        if (!challenge) {
            throw new CommunicationError("Challenge not received from server.");
        }
        if (challenge === "already authenticated") {
            logger.info("Already authenticated. Skipping registration.");
            return true;
        }
        const signature = await signRsa(privateKey, challenge);
        logger.debug(`Signature: ${signature}`);

        const payload: RegisterFollowUpPayload = {
            login,
            publicKey,
            signature,
        };
        logger.debug(`Payload prepared to send to server: ${JSON.stringify(payload)}.`);
        const registrationSuccessful = await requestChallengeVerification(payload);
        if (!registrationSuccessful) {
            Toast.show("Nie udało się zarejestrować na serwerze.", {
                duration: Toast.durations.SHORT,
            });
        }
        return registrationSuccessful;
    } catch (error) {
        logger.error(`registerInit error=${JSON.stringify(error)}`);
        return false;
    }
}

export function socketConnect(): void {
    logger.info("Connecting to the backend server with websocket connection.");
    socket.connect();
}

socket.on("connect", (): void => {
    logger.info("Connected to the backend server with websocket connection.");
    logger.debug(`Server address: ${JSON.stringify(process.env.SERVER_WEBSOCKET_URL)}.`);
    Toast.show("Połączono z serwerem.", {
        duration: Toast.durations.SHORT,
    });
});

socket.on("disconnect", (reason, description): void => {
    logger.info(
        `Disconnected from server. Reason: ${reason}, description: ${JSON.stringify(description)}`,
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
    logger.info(`Emitting "chat" event.`);
    try {
        const response = await socket.timeout(10000).emitWithAck("chat", transportedMessage);
        if (response === "success") {
            logger.info("Message delivered successfully.");
            logger.info("Saving delivered message to the local database.");
            try {
                await addMessage(message, sqlDbSession);
                return true;
            } catch (error) {
                logger.error(
                    `Failed to save message to the local database. Error=${JSON.stringify(error)}`,
                );
                return false;
            }
        } else {
            logger.error("Failed to deliver a message. Not saving it to the local database.");
            return false;
        }
    } catch (error) {
        logger.error(
            `chat emitting error. Didn't receive confirmation. Error=${JSON.stringify(error)}`,
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
    logger.info("Sending a message.");
    logger.debug(`Message details: ${JSON.stringify(message)}, publicKeyTo: ${publicKeyTo}`);
    const publicKeyFrom = mmkvStorage.getString("publicKey");
    if (!publicKeyFrom) {
        logger.error("Sender's or receiver's public key not found. Cannot send a message.");
        logger.debug(
            `publicKeyFrom=${JSON.stringify(publicKeyFrom)}, publicKeyTo=${JSON.stringify(
                publicKeyTo,
            )}`,
        );
        throw new PreconditionError("First party's key(s) not found. Cannot send message.");
    }
    const transportReadyMessage: TransportedMessage = await prepareToSend(
        message,
        publicKeyFrom,
        publicKeyTo,
        sdexEngine,
    );
    logger.info(`Emitting "chat" event.`);
    const successfulSend = await executeSendMessage(transportReadyMessage, message, sqlDbSession);
    if (successfulSend) {
        logger.info("Message sent successfully.");
        return true;
    }
    logger.error("Failed to send a message.");
    return false;
}

socket.on("chatInit", async (data: ChatInitPayload): Promise<string> => {
    logger.info('Received "chatInit" event from server.');

    const firstPartyPublicKey = mmkvStorage.getString("publicKey");
    const firstPartyPrivateKey = mmkvStorage.getString("privateKey");
    if (!firstPartyPublicKey || !firstPartyPrivateKey) {
        throw new PreconditionError("Missing first party key pair.");
    }

    if (data.publicKeyTo !== firstPartyPublicKey) {
        logger.error("Received public key doesn't match first party's actual public key.");
        logger.debug(
            `First party public key received: ${JSON.stringify(stringToBytes(data.publicKeyTo))}`,
        );
        logger.debug(
            `First party actual public key: "${JSON.stringify(
                stringToBytes(firstPartyPublicKey),
            )}"`,
        );
        throw new CommunicationError(
            "Receiver public key from server doesn't match first party's public key.",
        );
    }

    const thirdPartyContext = useCryptoContextStore.getState().sdexEngines.get(data.publicKeyFrom);
    if (thirdPartyContext) {
        logger.info("Third party crypto context already exists. Updating it.");
    } else {
        logger.info("Third party crypto context for that contact doesn't exist. Creating it.");
    }

    logger.info("Decrypting third party's part of session key.");
    const sessionKeyFirstPart = stringToBytes(
        await decryptRsa(firstPartyPrivateKey, data.sessionKeyPartEncrypted),
    );

    // Generating a second part of the session key of equal length to the 1st half
    const sessionKeySecondPart = generateSessionKeyPart(sessionKeyFirstPart.length);
    logger.info("Encrypting 2nd part of the session key.");
    const sessionKeySecondPartEncrypted = await encryptRsa(
        data.publicKeyFrom,
        bytesToString(sessionKeySecondPart),
    );

    logger.info("Saving combined session key parts to crypto context store");
    const sessionKey = mergeUint8Arrays(sessionKeyFirstPart, sessionKeySecondPart);
    const sdexEngine = new SdexCrypto(sessionKey);
    useCryptoContextStore.getState().addUserEngine(data.publicKeyFrom, sdexEngine);

    // Returning only the second part of the key to the server, not the whole session key!
    logger.info("Returning encrypted second part of the key back to the server.");
    return sessionKeySecondPartEncrypted;
});

/**
 * Send first party's crypto context needed for SDEx decryption of their messages
 * @param publicKeyTo Receiver's public key
 */
export async function initiateChat(publicKeyTo: string): Promise<boolean> {
    logger.info("Initiating chat.");
    const existingSessionKey = useCryptoContextStore.getState().sdexEngines.get(publicKeyTo);
    if (existingSessionKey) {
        logger.info("Session key for this third party already exists. Skipping request.");
        return true;
    }
    logger.info("No existing session key found. Sending a request.");

    const firstPartyPublicKey = mmkvStorage.getString("publicKey");
    const firstPartyPrivateKey = mmkvStorage.getString("privateKey");

    // Checking preconditions
    if (!firstPartyPublicKey || !firstPartyPrivateKey) {
        logger.debug(
            `First party public key=${JSON.stringify(
                firstPartyPublicKey,
            )}, first party private key=${JSON.stringify(firstPartyPrivateKey)}`,
        );
        throw new PreconditionError("First party's key(s) not found. Cannot initiate chat.");
    }

    // Session key for this contact doesn't exist yet. Generating first part of it.
    const sessionKeyFirstPart = generateSessionKeyPart();

    logger.info("(RSA) Encrypting first part of session key before sending.");
    const sessionKeyFirstPartEncrypted = await encryptRsa(
        publicKeyTo,
        bytesToString(sessionKeyFirstPart),
    );

    logger.info('Emitting "chatInit" event.');
    try {
        const response = await socket.timeout(10000).emitWithAck("chatInit", {
            publicKeyFrom: firstPartyPublicKey,
            publicKeyTo,
            sessionKeyPartEncrypted: sessionKeyFirstPartEncrypted,
        });
        if (!response) {
            logger.error("chatInit response from server is undefined.");
            return false;
        }
        logger.info("chatInit response received from server.");
        logger.debug(`chatInit response=${JSON.stringify(response)}`);
        try {
            const sessionKeySecondPartString = await decryptRsa(firstPartyPrivateKey, response);
            const sessionKeySecondPart = stringToBytes(sessionKeySecondPartString);
            const sessionKey = mergeUint8Arrays(sessionKeyFirstPart, sessionKeySecondPart);
            logger.debug(`Session key=${JSON.stringify(sessionKey)}`);

            logger.info("Saving generated session to third party crypto context mapping.");
            const sdexEngine = new SdexCrypto(sessionKey);
            useCryptoContextStore.getState().addUserEngine(publicKeyTo, sdexEngine);

            return true;
        } catch (error) {
            logger.error("Failed to decrypt session key part received from the third party.");
            logger.debug(`Error=${JSON.stringify(error)}`);
            return false;
        }
    } catch (error) {
        logger.error(`chatInit error=${JSON.stringify(error)}`);
        return false;
    }
}

socket.on("chat", async (message: TransportedMessage): Promise<boolean> => {
    logger.info('Received "chat" event from server.');
    logger.info("Getting context for SDEx engine.");
    const sdexEngine = useCryptoContextStore.getState().sdexEngines.get(message.publicKeyFrom);
    if (!sdexEngine) {
        logger.error("Crypto context not found. Cannot decrypt message.");
        return false;
    }

    const firstPartyPrivateKey = mmkvStorage.getString("privateKey");
    if (!firstPartyPrivateKey) {
        logger.error("First party private key not found. Cannot decrypt message.");
        return false;
    }

    const { sqlDbSession } = useSqlDbSessionStore.getState();
    if (!sqlDbSession) {
        logger.error("Database session not found. Cannot ingest a new message.");
        return false;
    }
    const contactFrom = await getContactByPublicKey(message.publicKeyFrom, sqlDbSession);
    if (!contactFrom) {
        logger.error("Contact not found. Cannot ingest a new message.");
        return false;
    }

    logger.info("Decrypting message.");
    const decryptedMessage = await prepareToIngest(
        message,
        sdexEngine,
        firstPartyPrivateKey,
        contactFrom.id as number, // if it's fetched from db we know it has an id
    );
    logger.debug(`Decrypted message=${JSON.stringify(decryptedMessage)}`);

    await addMessage(decryptedMessage, sqlDbSession);
    logger.info("Message ingested successfully.");
    logger.info("Adding message to the buffer.");
    // useMessagesBufferStore.getState().addNewMessage(decryptedMessage);
    return true;
});

/**
 * Check whether a public key is registered on the server.
 * This doesn't mean that a third party is currently online,
 * but if he isn't registered, it means he never before registered to the server with this public key.
 * @param publicKey public key to verify
 * @returns true if public key is registered on the server, false otherwise
 */
export async function checkKey(publicKey: string): Promise<boolean> {
    logger.info('Sending "checkKey" event to server.');
    try {
        const response = await socket.timeout(10000).emitWithAck("checkKey", { publicKey });
        logger.debug(`Response from server=${JSON.stringify(response)}.`);
        return response;
    } catch (error) {
        logger.error(`checkKey event error=${JSON.stringify(error)}`);
        return false;
    }
}

export async function checkOnline(publicKey: string): Promise<boolean> {
    logger.info('Sending "checkOnline" event to server.');
    try {
        const response = await socket.timeout(10000).emitWithAck("checkOnline", { publicKey });
        logger.debug(`Response from server=${JSON.stringify(response)}.`);
        return response;
    } catch (error) {
        logger.error(`Error=${JSON.stringify(error)}`);
        return false;
    }
}

export default socket;
