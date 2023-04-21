import { ChatRoomListItem, Contact, MessageItem } from "../components/Types";
import logger from "../Logger";
import {
  fetchChatRooms,
  fetchContacts,
  fetchMessages,
  getDbConnection,
  insertContact,
  insertMessage,
} from "./SqlStorageMiddlewares";

export const getContacts = async (): Promise<Contact[] | void> => {
  logger.info("Getting chat rooms.");
  const contacts: Contact[] = Array<Contact>();
  logger.info("Obtaining database session.");
  const dbSession = await getDbConnection();
  const results = await fetchContacts(dbSession);
  if (results === undefined) {
    logger.warn("Failed to fetch contacts.");
  } else {
    results.forEach((result) => {
      for (let index = 0; index < result.rows.length; index++) {
        contacts.push(result.rows.item(index));
      }
    });
  }
  logger.info("Returning contacts list.");
  return contacts;
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
  } else {
    logger.error("Database middleware dispatched. Failed to save a contact.");
    return false;
  }
};

export const getChatRooms = async (): Promise<ChatRoomListItem[] | void> => {
  logger.info("Getting chat rooms.");
  const chatRooms: ChatRoomListItem[] = Array<ChatRoomListItem>();
  logger.info("Obtaining database session.");
  const dbSession = await getDbConnection();
  const results = await fetchChatRooms(dbSession);
  if (results === undefined) {
    logger.warn("Failed to fetch chat rooms.");
  } else {
    results.forEach((result) => {
      for (let index = 0; index < result.rows.length; index++) {
        chatRooms.push(result.rows.item(index));
      }
    });
  }
  logger.info("Returning chat rooms list.");
  return chatRooms;
};

export const getMessages = async (contact: Contact): Promise<MessageItem[] | void> => {
  logger.info("Getting messages with a provided contact.");
  const messages: MessageItem[] = Array<MessageItem>();
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
      for (let index = 0; index < result.rows.length; index++) {
        messages.push(result.rows.item(index));
      }
    });
    logger.info(
      "Database middleware dispatched successfully. Returning chat rooms list.",
    );
    return messages;
  }
};

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
  } else {
    logger.error("Database middleware dispatched. Failed to save a message.");
    return false;
  }
};
