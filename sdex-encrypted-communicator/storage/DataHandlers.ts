import { DataHandlerError } from "../Errors";
import logger from "../Logger";
import { GENERIC_DATA_HANDLER_ERROR_MSG } from "../Messages";
import { Contact } from "../Types";
import { fetchContacts, getDbConnection } from "./SqlStorageMiddlewares";

export const getContacts = async (): Promise<Contact[]> => {
  logger.debug("Executing DataHandlers.getContacts.");
  const contacts: Contact[] = [];
  logger.info("Obtaining database session.");
  try {
    const dbSession = await getDbConnection();
    logger.info("Dispatching database middleware.");
    const results = await fetchContacts(dbSession);
    results.forEach((result) => {
      for (let index = 0; index < result.rows.length; index += 1) {
        contacts.push(result.rows.item(index));
      }
    });
    logger.info("Returning contacts list.");
    return contacts;
  } catch (error) {
    logger.error("Failed to fetch contacts: " + error);
    throw new DataHandlerError(GENERIC_DATA_HANDLER_ERROR_MSG);
  }
};

export const saveContact = async (contact: Contact): Promise<boolean> => {
  logger.info("Saving new contact to SQL database.");
  logger.info("Obtaining database session.");
  const dbSession = await getDbConnection();
  logger.info("Dispatching database middleware.");
  const results = await insertContact(dbSession, contact);
  if (results) {
    logger.info("Database middleware dispatched. contact saved successfully.");
    return true;
  }
  logger.error("Database middleware dispatched. Failed to save a contact.");
  return false;
};

export const getChatRooms = async (): Promise<ChatRoomListItem[] | void> => {
  logger.info("Getting chat rooms.");
  const chatRooms: ChatRoomListItem[] = [];
  logger.info("Obtaining database session.");
  const dbSession = await getDbConnection();
  const results = await fetchChatRooms(dbSession);
  if (results === undefined) {
    logger.warn("Failed to fetch chat rooms.");
  } else {
    results.forEach((result) => {
      for (let index = 0; index < result.rows.length; index += 1) {
        chatRooms.push(result.rows.item(index));
      }
    });
  }
  logger.info("Returning chat rooms list.");
  return chatRooms;
};

export const getMessages = async (contact: Contact): Promise<MessageItem[] | void> => {
  logger.info("Getting messages with a provided contact.");
  const messages: MessageItem[] = [];
  logger.info("Obtaining database session.");
  const dbSession = await getDbConnection();
  logger.info("Dispatching database middleware.");
  const results = await fetchMessages(dbSession, contact.id);
  if (results === undefined) {
    logger.error(
      "Database middleware dispatched. Failed to get messages for the provided contact.",
    );
  } else {
    results.forEach((result) => {
      for (let index = 0; index < result.rows.length; index += 1) {
        messages.push(result.rows.item(index));
      }
    });
    logger.info(
      "Database middleware dispatched successfully. Returning chat rooms list.",
    );
    return messages;
  }
};

/**
 * Save message data into the database.
 * @param contact Contact info of the message author.
 * @param message Message data to save.
 * @returns True if the message was saved successfully, false otherwise.
 */
export const saveMessage = async (
  contact: Contact,
  message: MessageItem,
): Promise<boolean> => {
  logger.info("Saving new message to SQL database.");
  logger.info("Obtaining database session.");
  const dbSession = await getDbConnection();
  logger.info("Dispatching database middleware.");
  const results = await insertMessage(dbSession, contact.id, message);
  if (results) {
    logger.info("Database middleware dispatched. Message saved successfully.");
    return true;
  }
  logger.error("Database middleware dispatched. Failed to save a message.");
  return false;
};

export const getUnreadCount = async (): Promise<ResultSet> => {
  logger.debug("Executing DataHandlers.getUnreadCount.");
  logger.info("Obtaining database session.");
  const dbSession = await getDbConnection();
  try {
    logger.info("Returning unread count.");
    const results = await fetchUnreadCount(dbSession);
    return results[0].rows.item(0);
  } catch (error) {
    logger.error("Failed to fetch unread messages count.");
    throw new DataHandlerError(GENERIC_DATA_HANDLER_ERROR_MSG);
  }
};

export const saveFileToDocumentsDirectory = async (
  fileName: string,
  content: object,
): Promise<void> => {
  const filePath = `${FileSystem.documentDirectory}${fileName}}`;
  await writeFile(filePath, JSON.stringify(content));
};

export const readFileFromDocumentsDirectory = async (
  fileName: string,
): Promise<object> => {
  const filePath = `${FileSystem.documentDirectory}${fileName}}`;
  let content = await readFile(filePath);
  return JSON.parse(content);
};

export const saveFileToCacheDirectory = async (
  fileName: string,
  content: object,
): Promise<void> => {
  const filePath = `${FileSystem.cacheDirectory}${fileName}}`;
  await writeFile(filePath, JSON.stringify(content));
};

export const readFileFromCacheDirectory = async (fileName: string): Promise<object> => {
  const filePath = `${FileSystem.cacheDirectory}${fileName}}`;
  let content = await readFile(filePath);
  return JSON.parse(content);
};
