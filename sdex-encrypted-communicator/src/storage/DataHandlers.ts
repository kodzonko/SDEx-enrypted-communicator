import { WebSQLDatabase } from "expo-sqlite";
import { DataHandlerError, PreconditionError } from "../Errors";
import logger from "../Logger";
import { MISSING_SQL_DB_SESSION_FAILURE_MSG } from "../Messages";
import { ChatRoom, Contact, ContactListItem, Message } from "../Types";
import { readFile, selectFile } from "./FileOps";
import {
    addContactQuery,
    addMessageQuery,
    getChatRoomsQuery,
    getContactByIdQuery,
    getContactByPublicKeyQuery,
    getContactsQuery,
    getMessagesByContactIdQuery,
    getUnreadCountQuery,
    markMessagesAsReadQuery,
    removeContactQuery,
    updateContactQuery,
} from "./SqlStorageMiddlewares";

/**
 * Get all contacts from database.
 * @param dbSession WebSQLDatabase session.
 * @returns List of contacts.
 */
export const getContacts = async (dbSession?: WebSQLDatabase): Promise<ContactListItem[]> => {
    logger.info("[getContacts] Getting contacts.");
    const contacts: ContactListItem[] = [];
    if (!dbSession) {
        logger.error(`[getContacts] ${MISSING_SQL_DB_SESSION_FAILURE_MSG} Returning [].`);
        return contacts;
    }
    const results = await getContactsQuery(dbSession);
    logger.info("[getContacts] Converting database results to Contact[].");
    results.forEach((result) => {
        contacts.push(
            new ContactListItem(
                /* eslint-disable @typescript-eslint/no-unsafe-member-access */
                <number>result.contact_id,
                <string>result.name,
                <string>result.surname,
                /* eslint-enable @typescript-eslint/no-unsafe-member-access */
            ),
        );
    });
    logger.debug(`[getContacts] Results converted to Contacts: ${JSON.stringify(contacts)}`);
    logger.info("[getContacts] Returning contacts.");
    return contacts;
};

/**
 * Get a contact by id from database.
 * @param contactId Id of a contact to fetch from database.
 * @param dbSession WebSQLDatabase session.
 * @returns Contact object if the contact was found in the database, undefined otherwise.
 */
export const getContactById = async (
    contactId: number,
    dbSession?: WebSQLDatabase,
): Promise<Contact | undefined> => {
    logger.info("[getContactById] Getting contact by id.");
    if (!dbSession) {
        logger.error(`[getContactById] ${MISSING_SQL_DB_SESSION_FAILURE_MSG} Returning.`);
        return undefined;
    }
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
    const result = (await getContactByIdQuery(contactId, dbSession))[0];
    if (!result) {
        logger.info(
            `[getContactById] Contact with id=${contactId} not found in the database. Returning`,
        );
        return undefined;
    }
    logger.info("[getContactById] Converting database result to Contact.");
    const contact: Contact = new Contact(
        /* eslint-disable @typescript-eslint/no-unsafe-member-access */
        <string>result.name,
        <string>result.surname,
        <string>result.public_key,
        /* eslint-enable @typescript-eslint/no-unsafe-member-access */
        contactId,
    );
    logger.debug(`[getContactById] Result converted to Contact: ${JSON.stringify(contact)}`);
    logger.info("[getContactById] Returning contact.");
    return contact;
};

export const getContactByPublicKey = async (
    publicKey: string,
    dbSession?: WebSQLDatabase,
): Promise<Contact | undefined> => {
    logger.info("[getContactByPublicKey] Getting contact by publicKey.");
    if (!dbSession) {
        logger.error(
            `[getContactByPublicKey] getContactByPublicKey${MISSING_SQL_DB_SESSION_FAILURE_MSG} Returning.`,
        );
        return undefined;
    }
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
    const result = (await getContactByPublicKeyQuery(publicKey, dbSession))[0];
    if (!result) {
        logger.info(
            `[getContactByPublicKey] Contact with publicKey=${publicKey} not found in the database. Returning`,
        );
        return undefined;
    }
    logger.info("[getContactByPublicKey] Converting database result to Contact.");
    const contact: Contact = new Contact(
        /* eslint-disable @typescript-eslint/no-unsafe-member-access */
        <string>result.name,
        <string>result.surname,
        publicKey,
        Number(<string>result.contact_id),
        /* eslint-enable @typescript-eslint/no-unsafe-member-access */
    );
    logger.debug(`[getContactByPublicKey] Result converted to Contact: ${JSON.stringify(contact)}`);
    logger.info("[getContactByPublicKey] Returning contact.");
    return contact;
};

/**
 * Save contact into a database.
 * @param contact Contact data to save.
 * @param dbSession WebSQLDatabase session.
 * @returns True if the contact was saved successfully, false otherwise.
 */
export const addContact = async (
    contact: Contact,
    dbSession?: WebSQLDatabase,
): Promise<boolean> => {
    logger.info("[addContact] Saving a contact.");
    if (!dbSession) {
        logger.error(`[addContact] ${MISSING_SQL_DB_SESSION_FAILURE_MSG} Returning false.`);
        return false;
    }
    // Replace windows (\r\n) newlines with unix newlines (\n).
    // Might be needed if key was imported from windows-created file.
    // eslint-disable-next-line no-param-reassign
    contact.publicKey = contact.publicKey.replace(/\r/gm, "");
    const results = await addContactQuery(contact, dbSession);
    if (results.rowsAffected === 1 && typeof results.insertId === "number") {
        logger.debug(`[addContact] Contact saved successfully. Inserted id=${results.insertId}`);
        logger.info("[addContact] Contact saved successfully.");
        /* eslint-disable-next-line no-param-reassign */
        contact.id = results.insertId;
        logger.info(
            "[addContact] Contact instance has been updated with an id generated by database.",
        );
        return true;
    }
    logger.error("[addContact] Failed to save a contact.");
    return false;
};

export const updateContact = async (
    contact: Contact,
    dbSession?: WebSQLDatabase,
): Promise<boolean> => {
    logger.info("[updateContact] Updating a contact.");
    if (!dbSession) {
        logger.error(`[updateContact] ${MISSING_SQL_DB_SESSION_FAILURE_MSG} Returning false.`);
        return false;
    }
    if (contact.id === undefined) {
        logger.error(
            "[updateContact] Contact id=undefined (probably contact wasn't loaded from database). Returning false.",
        );
        return false;
    }
    const results = await updateContactQuery(contact, dbSession);
    if (results.rowsAffected === 1) {
        logger.info("[updateContact] Contact updated successfully.");
        /* eslint-disable-next-line no-param-reassign */
        return true;
    }
    logger.error("[updateContact] Failed to update a contact.");
    return false;
};

export const removeContact = async (
    contactId: number,
    dbSession?: WebSQLDatabase,
): Promise<boolean> => {
    logger.info(`[removeContact] Removing contact with id=${contactId}`);
    if (!dbSession) {
        logger.error(`[removeContact] ${MISSING_SQL_DB_SESSION_FAILURE_MSG} Returning false.`);
        return false;
    }
    const results = await removeContactQuery(contactId, dbSession);
    if (results.rowsAffected === 1) {
        logger.info("[removeContact] Contact removed successfully.");
        return true;
    }
    logger.error("[removeContact] Failed to remove a contact.");
    return false;
};

/**
 * Get data to display ChatRooms lists.
 * @param dbSession WebSQLDatabase session.
 * @returns List of ChatRoomListItem objects.
 */
export const getChatRooms = async (dbSession?: WebSQLDatabase): Promise<ChatRoom[]> => {
    logger.info("[getChatRooms] Getting chat rooms.");
    const chatRooms: ChatRoom[] = [];
    if (!dbSession) {
        logger.error(`[getChatRooms] ${MISSING_SQL_DB_SESSION_FAILURE_MSG} Returning []`);
        return chatRooms;
    }
    const results = await getChatRoomsQuery(dbSession);
    logger.info("[getChatRooms] Converting database results to ChatRoom items.");
    results.forEach((result) => {
        chatRooms.push(
            new ChatRoom(
                /* eslint-disable @typescript-eslint/no-unsafe-member-access */
                <string>result.name,
                <string>result.surname,
                <number>result.contact_id,
                new Date(<string>result.last_message_date),
                <number>result.unread_message_count,
                /* eslint-enable @typescript-eslint/no-unsafe-member-access */
            ),
        );
    });
    logger.debug(`[getChatRooms] Results converted to ChatRooms: ${JSON.stringify(chatRooms)}`);
    logger.info("[getChatRooms] Returning chat rooms.");
    return chatRooms;
};

/**
 *  Get messages with a provided contact.
 * @param contactId Id of the contact associated with the messages.
 * @param dbSession WebSQLDatabase session.
 * @returns List of messages with the provided contact.
 */
export const getMessagesByContactId = async (
    contactId: number,
    dbSession?: WebSQLDatabase,
): Promise<Message[]> => {
    logger.info("[getMessagesByContactId] Getting messages with a provided contact.");
    const messages: Message[] = [];
    if (!dbSession) {
        logger.error(`[getMessagesByContactId] ${MISSING_SQL_DB_SESSION_FAILURE_MSG} Returning []`);
        return messages;
    }
    const results = await getMessagesByContactIdQuery(contactId, dbSession);
    logger.info("[getMessagesByContactId] Converting database results to Message[].");
    results.forEach((result) => {
        messages.push(
            new Message(
                /* eslint-disable @typescript-eslint/no-unsafe-member-access */
                <number>result.contact_id_from,
                <number>result.contact_id_to,
                <string>result.text,
                new Date(<string>result.created_at),
                <number>result.unread === 1,
                result.image ? <string>result.image : undefined,
                result.video ? <string>result.video : undefined,
                result.audio ? <string>result.audio : undefined,
                <number>result.message_id,
                /* eslint-enable @typescript-eslint/no-unsafe-member-access */
            ),
        );
    });
    logger.debug(
        `[getMessagesByContactId] Results converted to Messages=${JSON.stringify(messages)}`,
    );
    logger.info("[getMessagesByContactId] Returning messages list.");
    return messages;
};

/**
 * Save message into a database.
 * @param message Message data to save.
 * @param dbSession WebSQLDatabase session.
 * @returns True if the message was saved successfully, false otherwise.
 */
export const addMessage = async (
    message: Message,
    dbSession?: WebSQLDatabase,
): Promise<boolean> => {
    logger.info("[addMessage] Saving a message.");
    if (!dbSession) {
        logger.error(`[addMessage] ${MISSING_SQL_DB_SESSION_FAILURE_MSG}`);
        throw new PreconditionError(
            "[addMessage] Cannot save a message. Database session is missing.",
        );
    }
    const senderContact = await getContactById(message.contactIdFrom, dbSession);
    const receiverContact = await getContactById(message.contactIdFrom, dbSession);
    if (!(senderContact || receiverContact)) {
        logger.debug(
            `[addMessage] senderContact=${JSON.stringify(
                senderContact,
            )}, receiverContact=${JSON.stringify(receiverContact)}`,
        );
        if (!senderContact) {
            logger.error("[addMessage] Sender's contact id not found in the database");
        }
        if (!receiverContact) {
            logger.error("[addMessage] Receiver's contact id not found in the database");
        }
        throw new DataHandlerError("[addMessage] Failed to save a message in the database.");
    }
    const results = await addMessageQuery(message, dbSession);
    if (results.rowsAffected === 1 && results.insertId) {
        logger.debug(`[addMessage] Message saved successfully. Inserted id=${results.insertId}`);
        logger.info("[addMessage] Message saved successfully.");
        /* eslint-disable-next-line no-param-reassign */
        message.id = results.insertId;
        logger.info(
            "[addMessage] Message instance has been updated with an id generated by database.",
        );
        return true;
    }
    logger.error("[addMessage] Failed to save a message.");
    return false;
};

/**
 * Query the database for a number of unread messages.
 * @param dbSession Open SQL database session.
 * @returns Number of unread messages.
 */
export const getUnreadCount = async (dbSession?: WebSQLDatabase): Promise<number> => {
    logger.info("[getUnreadCount] Getting a number of unread messages from SQL database.");
    if (!dbSession) {
        logger.error(`[getUnreadCount] ${MISSING_SQL_DB_SESSION_FAILURE_MSG} Returning count=0.`);
        return 0;
    }
    const results = await getUnreadCountQuery(dbSession);
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */
    const parsedResult: number = <number>results[0].count;
    logger.debug(`[getUnreadCount] Parsed result=${parsedResult}`);
    return parsedResult;
};

export const selectRsaKeyFile = async (): Promise<string | undefined> => {
    logger.info("[selectRsaKeyFile] Selecting RSA key file.");
    const uri = await selectFile();
    if (!uri) {
        logger.error("[selectRsaKeyFile] Failed to select RSA key file.");
        return undefined;
    }
    logger.info(`[selectRsaKeyFile] Returning content of the file=${uri}`);
    const fileContent = await readFile(uri);
    if (fileContent === undefined) {
        logger.error("[selectRsaKeyFile] Failed to read RSA key file or file is empty.");
    } else if (fileContent.length === 0) {
        logger.error("[selectRsaKeyFile] File is empty.");
    }
    logger.debug(`[selectRsaKeyFile] File content=${JSON.stringify(fileContent)}`);
    return fileContent;
};

export const markMessagesAsRead = async (
    thirdPartyContactId: number,
    dbSession?: WebSQLDatabase,
): Promise<boolean> => {
    logger.info(
        "[markMessagesAsRead] Marking all messages to and from a given contact id as read.",
    );
    if (!dbSession) {
        logger.error(`[markMessagesAsRead] ${MISSING_SQL_DB_SESSION_FAILURE_MSG}`);
        return false;
    }

    try {
        return await markMessagesAsReadQuery(thirdPartyContactId, dbSession);
    } catch (error: any) {
        logger.error("[markMessagesAsRead] Failed to mark messages as read.");
        throw new DataHandlerError(
            `[markMessagesAsRead] Failed to mark messages as read: ${JSON.stringify(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                error.message,
            )}`,
        );
    }
};
