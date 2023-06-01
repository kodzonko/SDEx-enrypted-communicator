import logger from "../Logger";
import { Contact } from "../Types";
import { fetchContacts,insertContact,openDatabase } from "./SqlStorageMiddlewares";

export const getContacts = async (): Promise<Contact[]> => {
  logger.info("Getting contacts from the SQL database.");
  const contacts: Contact[] = [];
  logger.info("Obtaining database session.");
  const dbSession = await openDatabase();
  if (!dbSession) {
    logger.error("Failed to open db session. Returning empty list.");
    return contacts;
  }
  const results = await fetchContacts(dbSession);
  logger.info("Converting database results to Contact items.");
  results.forEach((result) => {
    for (let index = 0; index < result.rows.length; index += 1) {
      contacts.push(result.rows.item(index));
    }
  });
  logger.info("Returning contacts list.");
  return contacts;
};

export const saveContact = async (contact: Contact): Promise<boolean> => {
  logger.info("Saving new contact to SQL database.");
  logger.info("Obtaining database session.");
  const dbSession = await openDatabase();
  if (!dbSession) {
    logger.error("Failed to open db session. Returning.");
    return false;
  }
  const successful = await insertContact(dbSession, contact);
  if (successful) {
    logger.info("Contact saved successfully.");
    return true;
  }
  logger.error("Failed to save a contact.");
  return false;
};

export const getChatRooms = async (): Promise<ChatRoomListItem[]> => {
  logger.info("Getting chat rooms.");
  const chatRooms: ChatRoomListItem[] = [];
  logger.info("Obtaining database session.");
  const dbSession = await openDatabase();
  if (!dbSession) {
    logger.error("Failed to open db session. Returning empty list.");
    return chatRooms;
  }
  const results = await fetchChatRooms(dbSession);
  logger.info("Converting database results to ChatRoom items.");
  results.forEach((result) => {
    for (let index = 0; index < result.rows.length; index += 1) {
      chatRooms.push(result.rows.item(index));
    }
  });
  logger.info("Returning chat rooms list.");
  return chatRooms;
};

export const getMessages = async (contact: Contact): Promise<MessageItem[]> => {
  logger.info("Getting messages with a provided contact.");
  const messages: MessageItem[] = [];
  logger.info("Obtaining database session.");
  const dbSession = await openDatabase();
  if (!dbSession) {
    logger.error("Failed to open db session. Returning empty list.");
    return messages;
  }
  logger.info("Dispatching database middleware.");
  const results = await fetchMessages(dbSession, contact.id);
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
 * @returns True if the message was saved successfully, false otherwise.
 */
export const saveMessage = async (
  contactId: number,
  message: MessageItem,
): Promise<boolean> => {
  logger.info("Saving new message to SQL database.");
  logger.info("Obtaining database session.");
  const dbSession = await openDatabase();
  if (!dbSession) {
    logger.error("Failed to open db session. Returning.");
    return false;
  }
  const results = await insertMessage(dbSession, contactId, message);
  if (results) {
    logger.info("Message saved successfully.");
    return true;
  }
  logger.error("Failed to save a message.");
  return false;
};

export const getUnreadCount = async (): Promise<number> => {
  logger.debug("Getting a number of unread messages from the SQL database.");
  logger.info("Obtaining database session.");
  const dbSession = await openDatabase();
  if (!dbSession) {
    logger.error("Failed to open db session. Returning 0.");
    return 0;
  }
  logger.info("Returning unread count.");
  const results = await fetchUnreadCount(dbSession);
  return results[0].rows.item(0);
};
