import { sha512 } from "@noble/hashes/sha512";
import { WebSQLDatabase } from "expo-sqlite";
import { Alert } from "react-native";
import Toast from "react-native-root-toast";
import { io, Socket } from "socket.io-client";
import { GENERIC_OKAY_DISMISS_ALERT_BUTTON } from "../components/Buttons";
import { useCryptoContextStore } from "../contexts/CryptoContext";
import { useServerStore } from "../contexts/Server";
import { chooseSdexCryptoContext } from "../crypto/cryptoHelpers";
import SdexCrypto from "../crypto/SdexCrypto";
import logger from "../Logger";
import { FAILED_TO_REGISTER_USER_ALERT_MSG } from "../Messages";
import { addMessage, getContactById } from "../storage/DataHandlers";
import { mmkvStorage } from "../storage/MmkvStorageMiddlewares";
import {
  ChatInitPayload,
  ClientToServerEvents,
  Message,
  ServerToClientEvents,
  StatusResponse,
  TransportedMessage,
} from "../Types";
import { messageToTransportedMessage, uint8ArrayToBase64String } from "../utils/Converters";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  process.env.SERVER_WEBSOCKET_URL as string,
  {
    path: "/ws/socket.io/",
    autoConnect: true,
    // query: { publicKey: mmkvStorage.getString("publicKey") },
    auth: { publicKey: mmkvStorage.getString("publicKey") },
  },
);

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
  Alert.alert("Offline", "Utracono połączenie z serwerem", [GENERIC_OKAY_DISMISS_ALERT_BUTTON]);
});

socket.on("connect_error", (error) => {
  logger.error(`Connection error=${JSON.stringify(error)}`);
});

export function requestRegister(): void {
  logger.info('Emitting "registerInit" event to server.');
  socket.emit("registerInit");
}

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
    { publicKey, privateKeyHash: uint8ArrayToBase64String(hashedPrivateKey), salt },
    (status: StatusResponse) => {
      if (status !== "success") {
        Alert.alert("Błąd", FAILED_TO_REGISTER_USER_ALERT_MSG, [GENERIC_OKAY_DISMISS_ALERT_BUTTON]);
        return;
      }
      Toast.show("Zarejestrowano na serwerze.", {
        duration: Toast.durations.SHORT,
      });
    },
  );
});

socket.on("registerFollowUp", (status: StatusResponse): void => {
  logger.info('Received "registerFollowUp" event from server.');
  logger.debug(`Data received=${status}.`);
  if (status === "success") {
    logger.info("Successfully registered on server.");
    useServerStore.getState().setRegistered();
    Toast.show("Zarejestrowano na serwerze.", {
      duration: Toast.durations.SHORT,
    });
  } else {
    logger.error("Failed to register on server.");
    Alert.alert("Błąd", FAILED_TO_REGISTER_USER_ALERT_MSG, [GENERIC_OKAY_DISMISS_ALERT_BUTTON]);
  }
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
export async function sendMessage(message: Message, sqlDbSession: WebSQLDatabase): Promise<void> {
  logger.info("Sending a message.");
  const publicKeyFrom = mmkvStorage.getString("publicKey");
  const publicKeyTo = await getContactById(message.contactIdTo).then(
    (contact) => contact?.publicKey,
  );
  if (!publicKeyFrom || !publicKeyTo) {
    logger.error("Sender's or receiver's public key not found. Cannot send a message.");
    logger.debug(
      `publicKeyFrom=${JSON.stringify(publicKeyFrom)}, publicKeyTo=${JSON.stringify(publicKeyTo)}`,
    );
    return;
  }
  const transportReadyMessage: TransportedMessage = messageToTransportedMessage(
    message,
    publicKeyFrom,
    publicKeyTo,
  );
  const sentSuccessfully: boolean = executeSendMessage(transportReadyMessage);
  if (sentSuccessfully) {
    logger.info("Saving delivered message to the local database.");
    await addMessage(message, sqlDbSession);
  }
}

socket.on("chatInit", (data: ChatInitPayload, callback): void => {
  logger.info('Received "chatInit" event from server.');
  const thirdPartyContext = useCryptoContextStore
    .getState()
    .othersCryptoContexts.get(data.publicKeyFrom);
  const sessionKey = thirdPartyContext?.sessionKey ?? data.sessionKey;
  if (!sessionKey) {
    logger.error("Session key not found both in our state and in chatInit payload.");
    return;
  }
  useCryptoContextStore
    .getState()
    .addOthersCryptoContext(
      data.publicKeyFrom,
      sessionKey,
      data.initializationHash,
      data.hashFromUserPassword,
    );
  callback(thirdPartyContext?.sessionKey);
});

/**
 * Send data that's needed for message receiver to decrypt the message.
 */
export function initializeChat(publicKeyTo: string): void {
  logger.info('Emitting "chatInit" event.');
  const myPublicKey = mmkvStorage.getString("publicKey");
  const myContext = useCryptoContextStore.getState().myCryptoContext;
  if (!myPublicKey || !myContext?.initializationHash || !myContext?.hashFromUserPassword) {
    throw new Error("Public key or your crpyto context not found. Cannot initialize chat.");
  }
  socket.emit(
    "chatInit",
    {
      publicKeyFrom: myPublicKey,
      publicKeyTo,
      initializationHash: myContext.initializationHash,
      hashFromUserPassword: myContext.hashFromUserPassword,
    },
    (sessionKey?: Uint8Array) => {
      if (sessionKey) {
        const thirdPartyContext = useCryptoContextStore
          .getState()
          .othersCryptoContexts.get(publicKeyTo);
        useCryptoContextStore
          .getState()
          .addOthersCryptoContext(
            publicKeyTo,
            sessionKey,
            thirdPartyContext?.initializationHash,
            thirdPartyContext?.hashFromUserPassword,
          );
      }
    },
  );
}

socket.on("chat", (message: TransportedMessage): void => {
  logger.info('Received "chat" event from server.');
  const context = chooseSdexCryptoContext(message.publicKeyFrom, message.publicKeyTo);
  const sdexEngine = new SdexCrypto(
    context.initializationHash,
    context.hashFromUserPassword,
    context.sessionKey,
  );
  const decryptedMessage = sdexEngine.decryptMessage(message);
});

export function checkRegistered(publicKey: string): void {
  socket.emit("checkKey", publicKey, (response: boolean) => {
    logger.info('Sending "checkKey" event to server.');
    logger.debug(`Response from server=${JSON.stringify(response)}.`);
    if (response) {
      useServerStore.getState().setRegistered();
    } else {
      useServerStore.getState().setUnregistered();
    }
  });
}

export default socket;
