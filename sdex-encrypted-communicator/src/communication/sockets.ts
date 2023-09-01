import { sha512 } from "@noble/hashes/sha512";
import { WebSQLDatabase } from "expo-sqlite";
import { Alert } from "react-native";
import Toast from "react-native-root-toast";
import { io, Socket } from "socket.io-client";
import { GENERIC_OKAY_DISMISS_ALERT_BUTTON } from "../components/Buttons";
import { useCryptoContextStore } from "../contexts/CryptoContext";
import { useSqlDbSessionStore } from "../contexts/DbSession";
import { useMessagesBufferStore } from "../contexts/MessagesBuffer";
import { useServerStore } from "../contexts/Server";
import { chooseSdexCryptoContext, generateSessionKey } from "../crypto/cryptoHelpers";
import { decryptRsa, encryptRsa } from "../crypto/RsaCrypto";
import SdexCrypto from "../crypto/SdexCrypto";
import logger from "../Logger";
import { FAILED_TO_REGISTER_USER_ALERT_MSG } from "../Messages";
import { addMessage, getContactByPublicKey } from "../storage/DataHandlers";
import { mmkvStorage } from "../storage/MmkvStorageMiddlewares";
import {
  ChatInitFollowUpPayload,
  ChatInitPayload,
  ClientToServerEvents,
  Message,
  ServerToClientEvents,
  StatusResponse,
  TransportedMessage,
} from "../Types";
import { bytesToString, stringToBytes } from "../utils/Converters";
import { prepareToIngest, prepareToSend } from "./PayloadComposers";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  process.env.SERVER_WEBSOCKET_URL as string,
  {
    path: "/ws/socket.io/",
    autoConnect: true,
    // query: { publicKey: mmkvStorage.getString("publicKey") },
    auth: { publicKey: mmkvStorage.getString("publicKey") },
    rejectUnauthorized: false,
    // transports: ["websocket"],
  },
);

export function requestRegister(): void {
  logger.info('Emitting "registerInit" event to server.');
  const publicKey = mmkvStorage.getString("publicKey");
  if (!publicKey) {
    throw new Error("Public key not found. Cannot register client on server.");
  }
  socket.emit("registerInit", publicKey);
}

export function socketConnect(): void {
  logger.info("Connecting to the backend server with websocket connection.");
  socket.connect();
}

socket.on("connect", (): void => {
  logger.info("Connected to the backend server with websocket connection.");
  logger.debug(`Server address: ${JSON.stringify(process.env.SERVER_WEBSOCKET_URL)}.`);
  requestRegister();
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
 * Handler for "registerInit" event from server.
 *
 * This event should be a server's response to client's register request,
 * which will contain a string with salt for client's RSA private key.
 * Private key is used as a password to authenticate client on server.
 */
socket.on("registerInit", (salt: string): void => {
  logger.info('Received "registerInit" event from server.');
  logger.debug(`Salt received=${salt}`);
  const publicKey = mmkvStorage.getString("publicKey");
  const privateKey = mmkvStorage.getString("privateKey");
  if (!publicKey || !privateKey) {
    logger.error("Private or public key not found. Cannot authenticate client on server.");
    Alert.alert(
      "Błąd",
      "Nie znaleziono jednego z kluczy RSA. Rejestracja klienta na serwerze jest niemożliwa.",
      [GENERIC_OKAY_DISMISS_ALERT_BUTTON],
    );
    return;
  }
  // Adding salt to private RSA key (=password) and hashing it
  const saltedPrivateKey = `${privateKey}${salt}`;
  const hashedPrivateKey = sha512(saltedPrivateKey);
  // Sending hashed private key to server
  logger.info('Emitting "registerFollowUp" event to server.');
  socket.emit(
    "registerFollowUp",
    { publicKey, privateKeyHash: bytesToString(hashedPrivateKey), salt },
    (status: StatusResponse) => {
      if (status !== "success") {
        useServerStore.getState().setUnregistered();
        Alert.alert("Błąd", FAILED_TO_REGISTER_USER_ALERT_MSG, [GENERIC_OKAY_DISMISS_ALERT_BUTTON]);
        return;
      }
      useServerStore.getState().setRegistered();
      Toast.show("Zarejestrowano na serwerze.", {
        duration: Toast.durations.SHORT,
      });
    },
  );
});

/**
 * Function handling actual sending of a message to the server.
 * @param message Object containing encrypted message and all relevant metadata safe to send to a server.
 */
function executeSendMessage(message: TransportedMessage): boolean {
  logger.info(`Emitting "chat" event.`);
  let result = false;
  socket.emit("chat", message, (status: StatusResponse): void => {
    if (status === "success") {
      logger.info("Message delivered successfully.");
      result = true;
    } else {
      logger.error("Failed to deliver a message.");
      result = false;
    }
  });
  return result;
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
): Promise<void> {
  logger.info("Sending a message.");
  const publicKeyFrom = mmkvStorage.getString("publicKey");
  if (!publicKeyFrom) {
    logger.error("Sender's or receiver's public key not found. Cannot send a message.");
    logger.debug(
      `publicKeyFrom=${JSON.stringify(publicKeyFrom)}, publicKeyTo=${JSON.stringify(publicKeyTo)}`,
    );
    return;
  }
  const transportReadyMessage: TransportedMessage = await prepareToSend(
    message,
    publicKeyFrom,
    publicKeyTo,
    sdexEngine,
  );
  const sentSuccessfully: boolean = executeSendMessage(transportReadyMessage);
  if (sentSuccessfully) {
    logger.info("Saving delivered message to the local database.");
    await addMessage(message, sqlDbSession);
  } else {
    logger.error("Failed to deliver a message. Not saving it to the local database.");
  }
}

export function sendChatInitFollowUp(data: ChatInitFollowUpPayload) {
  logger.info('Emitting "chatInitFollowUp" event.');
  socket.emit("chatInitFollowUp", data);
}

socket.on("chatInit", async (data: ChatInitPayload): Promise<void> => {
  logger.info('Received "chatInit" event from server.');
  const thirdPartyContext = useCryptoContextStore
    .getState()
    .othersCryptoContexts.get(data.publicKeyFrom);

  const myPublicKey = mmkvStorage.getString("publicKey");
  const myPrivateKey = mmkvStorage.getString("privateKey");
  if (!myPublicKey || !myPrivateKey) {
    throw new Error("Missing first party key pair.");
  }

  const decryptedInitializationHash = stringToBytes(
    await decryptRsa(myPrivateKey, data.initializationHashEncrypted),
  );

  const decryptedHashFromUserPassword = stringToBytes(
    await decryptRsa(myPrivateKey, data.hashFromUserPasswordEncrypted),
  );
  const decryptedSessionKey = stringToBytes(
    await decryptRsa(myPrivateKey, data.sessionKeyEncrypted),
  );

  const existingSessionKey = thirdPartyContext?.sessionKey;
  // If there's no existing session key saved for the contact of if the received one is the same as existing
  if ((existingSessionKey && existingSessionKey === decryptedSessionKey) || !existingSessionKey) {
    useCryptoContextStore
      .getState()
      .addOthersCryptoContext(
        data.publicKeyFrom,
        decryptedSessionKey,
        decryptedInitializationHash,
        decryptedHashFromUserPassword,
      );
  } else {
    // Session keys collide. Save other context data but send back the existing session key.
    useCryptoContextStore
      .getState()
      .addOthersCryptoContext(
        data.publicKeyFrom,
        existingSessionKey,
        decryptedInitializationHash,
        decryptedHashFromUserPassword,
      );
    const encryptedExistingSessionKey = await encryptRsa(
      data.publicKeyFrom,
      bytesToString(existingSessionKey),
    );
    sendChatInitFollowUp({
      sessionKeyEncrypted: encryptedExistingSessionKey,
      publicKeyFrom: myPublicKey,
    });
  }
});

/**
 * Send data that's needed for message receiver to decrypt the message.
 */
export async function initializeChat(publicKeyTo: string): Promise<void> {
  logger.info('Emitting "chatInit" event.');
  const myPublicKey = mmkvStorage.getString("publicKey");
  const myPrivateKey = mmkvStorage.getString("privateKey");
  const myContext = useCryptoContextStore.getState().myCryptoContext;
  if (
    !myPublicKey ||
    !myPrivateKey ||
    !myContext?.initializationHash ||
    !myContext?.hashFromUserPassword
  ) {
    logger.error("Public key or your crypto context not found. Cannot initialize chat.");
    logger.debug(
      `myPublicKey=${JSON.stringify(myPublicKey)}, myContext=${JSON.stringify(myContext)}`,
    );
    throw new Error("Public key or your crypto context not found. Cannot initialize chat.");
  }
  const initializationHashEncrypted = await encryptRsa(
    publicKeyTo,
    bytesToString(myContext.initializationHash),
  );

  const hashFromUserPasswordEncrypted = await encryptRsa(
    publicKeyTo,
    bytesToString(myContext.hashFromUserPassword),
  );

  const existingSessionKey = useCryptoContextStore
    .getState()
    .othersCryptoContexts.get(publicKeyTo)?.sessionKey;
  const existingOrGeneratedSessionKey = existingSessionKey || generateSessionKey();

  const sessionKeyEncrypted = await encryptRsa(
    publicKeyTo,
    bytesToString(existingOrGeneratedSessionKey),
  );

  useCryptoContextStore
    .getState()
    .addOthersCryptoContext(publicKeyTo, existingOrGeneratedSessionKey);

  socket.emit("chatInit", {
    publicKeyFrom: myPublicKey,
    publicKeyTo,
    initializationHashEncrypted,
    hashFromUserPasswordEncrypted,
    sessionKeyEncrypted,
  });
}

socket.on("chatInitFollowUp", async (data: ChatInitFollowUpPayload): Promise<void> => {
  logger.info('Received "chatInitFollowUp" event.');
  const myPublicKey = mmkvStorage.getString("publicKey");
  const myPrivateKey = mmkvStorage.getString("privateKey");
  if (!myPublicKey || !myPrivateKey) {
    throw new Error("Missing first party key pair.");
  }
  const sessionKey = stringToBytes(await decryptRsa(myPrivateKey, data.sessionKeyEncrypted));

  const existingSessionKey = useCryptoContextStore
    .getState()
    .othersCryptoContexts.get(data.publicKeyFrom)?.sessionKey;
  if (!existingSessionKey) {
    useCryptoContextStore.getState().addOthersCryptoContext(data.publicKeyFrom, sessionKey);
    return;
  }
  if (existingSessionKey !== sessionKey) {
    const encryptedExistingSessionKey = await encryptRsa(
      data.publicKeyFrom,
      bytesToString(existingSessionKey),
    );
    sendChatInitFollowUp({
      sessionKeyEncrypted: encryptedExistingSessionKey,
      publicKeyFrom: myPublicKey,
    });
  }
});

socket.on("chat", async (message: TransportedMessage): Promise<void> => {
  logger.info('Received "chat" event from server.');
  const context = chooseSdexCryptoContext(message.publicKeyFrom, message.publicKeyTo);
  const sdexEngine = new SdexCrypto(
    context.initializationHash,
    context.hashFromUserPassword,
    context.sessionKey,
  );
  const firstPartyPrivateKey = mmkvStorage.getString("privateKey");
  if (!firstPartyPrivateKey) {
    logger.error("First party private key not found. Cannot decrypt message.");
    return;
  }
  const { sqlDbSession } = useSqlDbSessionStore.getState();
  if (!sqlDbSession) {
    logger.error("Database session not found. Cannot ingest a new message.");
    return;
  }
  const contactFrom = await getContactByPublicKey(message.publicKeyFrom, sqlDbSession);
  if (!contactFrom) {
    logger.error("Contact not found. Cannot ingest a new message.");
    return;
  }
  const decryptedMessage = await prepareToIngest(
    message,
    sdexEngine,
    firstPartyPrivateKey,
    contactFrom.id as number, // if it's fetched from db we know it has an id
  );

  await addMessage(decryptedMessage, sqlDbSession);
  logger.info("Message ingested successfully.");
  logger.info("Adding message to the buffer.");
  const addNewMessage = useMessagesBufferStore((state) => state.addNewMessage);
  addNewMessage(decryptedMessage);
});

/**
 * Check whether a public key is registered on the server.
 * This doesn't mean that a third party is currently online,
 * but if he isn't registered, it means he never before registered to the server with this public key.
 * @param publicKey public key to verify
 * @returns true if public key is registered on the server, false otherwise
 */
export function checkKey(publicKey: string): void {
  socket.emit("checkKey", publicKey, (response: boolean) => {
    logger.info('Sending "checkKey" event to server.');
    logger.debug(`Response from server=${JSON.stringify(response)}.`);
    if (response) {
      return true;
    }
    return false;
  });
}

export function checkOnline(publicKey: string): boolean {
  let result = false;
  socket.emit("checkOnline", publicKey, (response: boolean) => {
    logger.info('Sending "checkOnline" event to server.');
    logger.debug(`Response from server=${JSON.stringify(response)}.`);
    logger.debug(`response=${JSON.stringify(response)}`);
    result = response;
  });
  return result;
}

export default socket;
