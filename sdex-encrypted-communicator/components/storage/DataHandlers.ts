import { WebSQLDatabase } from "expo-sqlite";
import logger from "../Logger";
import { MISSING_SQL_DB_SESSION_FAILURE_MSG } from "../Messages";
import { ChatRoomListItem, Contact, Message } from "../Types";
import {
  getChatRoomsQuery,
  getContactByIdQuery,
  getContactsQuery,
  getMessagesQuery,
  getUnreadCountQuery,
  saveContactQuery,
  saveMessageQuery,
} from "./SqlStorageMiddlewares";

export const getContacts = async (dbSession?: WebSQLDatabase): Promise<Contact[]> => {
  logger.info("Getting contacts from the SQL database.");
  const contacts: Contact[] = [];
  if (!dbSession) {
    logger.error("Failed to open db session. Returning empty list.");
    return contacts;
  }
  const results = await getContactsQuery(dbSession);
  logger.info("Converting database results to Contact items.");
  results.forEach((result) => {
    for (let index = 0; index < result.rows.length; index += 1) {
      contacts.push(result.rows.item(index));
    }
  });
  logger.info("Returning contacts list.");
  return contacts;
};

export const getContactById = async (
  dbSession: WebSQLDatabase,
  contactId: number,
): Promise<Contact | undefined> => {
  logger.info("Getting contact by id from SQL database.");
  if (!dbSession) {
    logger.error("Failed to open db session. Returning empty list.");
    return;
  }
  const results = await getContactByIdQuery(dbSession, contactId);
  logger.info("Converting database result to Contact.");
  const contact: Contact = results[0].rows.item(0);

  logger.info("Returning contacts list.");
  return contact;
};

export const saveContact = async (
  contact: Contact,
  dbSession?: WebSQLDatabase,
): Promise<boolean> => {
  logger.info("Saving a contact to SQL database.");
  if (!dbSession) {
    logger.error(MISSING_SQL_DB_SESSION_FAILURE_MSG + " Returning false.");
    return false;
  }
  const successful = await saveContactQuery(dbSession, contact);
  if (successful) {
    logger.info("Contact saved successfully.");
    return true;
  }
  logger.error("Failed to save a contact.");
  return false;
};

export const getChatRooms = async (
  dbSession?: WebSQLDatabase,
): Promise<ChatRoomListItem[]> => {
  logger.info("Getting chat rooms from SQL database.");
  const chatRooms: ChatRoomListItem[] = [];
  if (!dbSession) {
    logger.error(MISSING_SQL_DB_SESSION_FAILURE_MSG + " Returning []");
    return chatRooms;
  }
  const results = await getChatRoomsQuery(dbSession);
  logger.info("Converting database results to ChatRoom items.");
  results.forEach((result) => {
    for (let index = 0; index < result.rows.length; index += 1) {
      chatRooms.push(result.rows.item(index));
    }
  });
  logger.info("Returning chat rooms list.");
  return chatRooms;
};

export const getMessages = async (
  contactId: number,
  dbSession?: WebSQLDatabase,
): Promise<Message[]> => {
  logger.info("Getting messages with a provided contact.");
  const messages: Message[] = [];
  if (!dbSession) {
    logger.error(MISSING_SQL_DB_SESSION_FAILURE_MSG + " Returning []");
    return messages;
  }
  logger.info("Dispatching database middleware.");
  const results = await getMessagesQuery(dbSession, contactId);
  logger.info("Converting database results to MessageItems.");
  results.forEach((result) => {
    for (let index = 0; index < result.rows.length; index += 1) {
      messages.push(result.rows.item(index));
    }
  });
  logger.info("Returning chat rooms list.");
  return messages;
};

/**
 * Save message data into the database.
 * @param contactId Contact ID of the message author.
 * @param message Message data to save.
 * @param dbSession WebSQLDatabase session.
 * @returns True if the message was saved successfully, false otherwise.
 */
export const saveMessage = async (
  contactId: number,
  message: Message,
  dbSession?: WebSQLDatabase,
): Promise<boolean> => {
  logger.info("Saving new message to SQL database.");
  if (!dbSession) {
    logger.error(MISSING_SQL_DB_SESSION_FAILURE_MSG + " Returning false.");
    return false;
  }
  const results = await saveMessageQuery(dbSession, message);
  if (results) {
    logger.info("Message saved successfully.");
    return true;
  }
  logger.error("Failed to save a message.");
  return false;
};

export const getUnreadCount = async (dbSession?: WebSQLDatabase): Promise<number> => {
  logger.info("Getting a number of unread messages from SQL database.");
  if (!dbSession) {
    logger.error("Failed to open db session. Returning 0.");
    return 0;
  }
  logger.info("Returning unread count.");
  const results = await getUnreadCountQuery(dbSession);
  return results[0].rows.item(0);
};
