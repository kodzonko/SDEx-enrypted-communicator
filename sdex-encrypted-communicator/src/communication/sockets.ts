import { WebSQLDatabase } from "expo-sqlite";
import Toast from "react-native-root-toast";
import { io, Socket } from "socket.io-client";
import { useCryptoContextStore } from "../contexts/CryptoContext";
import { useSqlDbSessionStore } from "../contexts/DbSession";
import { useMessagesBufferStore } from "../contexts/MessagesBuffer";
import { useServerStore } from "../contexts/Server";
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
  StatusResponse,
  TransportedMessage,
} from "../Types";
import { bytesToString, mergeUint8Arrays, stringToBytes } from "../utils/Converters";
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
  socket.emit("registerInit", async (challenge: string): Promise<void> => {
    logger.info("Register request sent to the server.");
    logger.debug(`Challenge received from server: ${JSON.stringify(challenge)}.`);
    if (!challenge) {
      useServerStore.getState().setUnregistered();
      throw new CommunicationError("Challenge not received from server.");
    }
    if (challenge === "already authenticated") {
      logger.info("Already authenticated. Skipping registration.");
      useServerStore.getState().setRegistered();
      return;
    }
    if (challenge === "error") {
      logger.error("Error occurred during registration.");
      useServerStore.getState().setUnregistered();
      return;
    }
    const signature = await signRsa(privateKey, challenge);
    logger.debug(`Signature: ${signature}`);
    const payload: RegisterFollowUpPayload = {
      login,
      publicKey,
      signature,
    };
    logger.debug(`Payload to send to server: ${JSON.stringify(payload)}.`);
    socket.emit("registerFollowUp", payload, (response: string): void => {
      logger.info("Register response received from server.");
      if (response === "success") {
        logger.info("Successfully registered on the server.");
        useServerStore.getState().setRegistered();
      } else {
        logger.error("Failed to register on the server.");
        useServerStore.getState().setUnregistered();
        Toast.show("Nie udało się zarejestrować na serwerze.", {
          duration: Toast.durations.SHORT,
        });
      }
    });
  });
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
function executeSendMessage(
  transportedMessage: TransportedMessage,
  message: Message,
  sqlDbSession: WebSQLDatabase,
): void {
  logger.info(`Emitting "chat" event.`);
  socket.emit("chat", transportedMessage, async (status: StatusResponse): Promise<void> => {
    if (status === "success") {
      logger.info("Message delivered successfully.");
      logger.info("Saving delivered message to the local database.");
      await addMessage(message, sqlDbSession);
    } else {
      logger.error("Failed to deliver a message. Not saving it to the local database.");
    }
  });
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
  logger.debug(`Message details: ${JSON.stringify(message)}, publicKeyTo: ${publicKeyTo}`);
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
  executeSendMessage(transportReadyMessage, message, sqlDbSession);
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
      `First party actual public key: "${JSON.stringify(stringToBytes(firstPartyPublicKey))}"`,
    );
    throw new CommunicationError(
      "Receiver public key from server doesn't match first party's public key.",
    );
  }

  const thirdPartyContext = useCryptoContextStore.getState().sessionKeys.get(data.publicKeyFrom);
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
  useCryptoContextStore.getState().addSessionKey(data.publicKeyFrom, sessionKey);

  // Returning only the second part of the key to the server, not the whole session key!
  logger.info("Returning encrypted second part of the key back to the server.");
  return sessionKeySecondPartEncrypted;
});

/**
 * Send first party's crypto context needed for SDEx decryption of their messages
 * @param publicKeyTo Receiver's public key
 */
export async function initiateChat(publicKeyTo: string): Promise<void> {
  logger.info("Initiating chat.");
  const existingSessionKey = useCryptoContextStore.getState().sessionKeys.get(publicKeyTo);
  if (existingSessionKey) {
    logger.info("Session key for this third party already exists. Skipping request.");
    return;
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
  socket.emit(
    "chatInit",
    {
      publicKeyFrom: firstPartyPublicKey,
      publicKeyTo,
      sessionKeyPartEncrypted: sessionKeyFirstPartEncrypted,
    },
    async (response?: string): Promise<void> => {
      logger.info("Response received from server.");
      logger.debug(`Response=${JSON.stringify(response)}`);
      if (!response) {
        logger.error("Failed to initiate chat.");
      } else {
        logger.info("Successfully initiated chat.");
        try {
          const sessionKeySecondPartString = await decryptRsa(firstPartyPrivateKey, response);
          const sessionKeySecondPart = stringToBytes(sessionKeySecondPartString);
          const sessionKey = mergeUint8Arrays(sessionKeyFirstPart, sessionKeySecondPart);

          logger.info("Saving generated session to third party crypto context mapping.");
          useCryptoContextStore.getState().addSessionKey(publicKeyTo, sessionKey);
        } catch (error) {
          logger.error("Failed to decrypt session key part received from the third party.");
          logger.debug(`Error=${JSON.stringify(error)}`);
        }
      }
    },
  );
}

socket.on("chat", async (message: TransportedMessage): Promise<void> => {
  logger.info('Received "chat" event from server.');
  logger.info("Getting context for SDEx engine.");
  const sessionKey = useCryptoContextStore.getState().sessionKeys.get(message.publicKeyFrom);
  if (!sessionKey) {
    throw new PreconditionError("Crypto context not found. Cannot decrypt message.");
  }
  const sdexEngine = new SdexCrypto(sessionKey);

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
  useMessagesBufferStore.getState().addNewMessage(decryptedMessage);
});

/**
 * Check whether a public key is registered on the server.
 * This doesn't mean that a third party is currently online,
 * but if he isn't registered, it means he never before registered to the server with this public key.
 * @param publicKey public key to verify
 * @returns true if public key is registered on the server, false otherwise
 */
export function checkKey(publicKey: string): void {
  socket.emit("checkKey", { publicKey }, (response: boolean) => {
    logger.info('Sending "checkKey" event to server.');
    logger.debug(`Response from server=${JSON.stringify(response)}.`);
    if (response) {
      return true;
    }
    return false;
  });
}

export async function checkOnline(publicKey: string): Promise<boolean> {
  return new Promise((resolve) => {
    socket.emit("checkOnline", { publicKey }, (response: boolean) => {
      logger.info('Sending "checkOnline" event to server.');
      logger.debug(`Response from server=${JSON.stringify(response)}.`);
      logger.debug(`response=${JSON.stringify(response)}`);
      resolve(response);
    });
  });
}

export default socket;
