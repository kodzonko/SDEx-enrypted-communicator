import {
  enablePromise,
  openDatabase,
  ResultSet,
  SQLiteDatabase,
} from "react-native-sqlite-storage";
import { Contact, MessageItem } from "../components/Types";
import logger from "../Logger";

enablePromise(true);

export const getDbConnection = async () => {
  return openDatabase({
    name: "sdex-communicator.db",
    createFromLocation: "sdex-communicator.db",
    location: "default",
  });
};

export const insertContact = async (
  dbSession: SQLiteDatabase,
  contact: Contact,
): Promise<boolean> => {
  try {
    logger.info("Inserting a contact to the SQL database.");
    logger.info("Executing query.");
    const results = await dbSession.executeSql(
      `INSERT INTO contacts (name, surname, publicKey)
      VALUES(${contact.name}, ${contact.surname}, ${contact.publicKey});`,
    );
    logger.info("Query executed successfully.");
    logger.debug("Results: " + results);
    return true;
  } catch (error) {
    logger.error("SQL db connection error: " + error);
    return false;
  }
};

export const fetchChatRooms = async (
  dbSession: SQLiteDatabase,
): Promise<[ResultSet] | void> => {
  try {
    logger.info("Fetching chat rooms from the SQL database.");
    logger.info("Executing query.");
    const results = dbSession.executeSql(
      `SELECT c.name, c.surname, m.time, SUM(m.unread) AS unread
       FROM (select * from messages order by time DESC) as m
       JOIN contacts AS c ON m.fk_contact_id = c.contact_id
       GROUP BY c.name, c.surname
       ORDER BY m.time DESC;`,
    );
    logger.info("Query executed. Returning results.");
    logger.debug("Results: " + results);
    return results;
  } catch (error) {
    logger.error("SQL db connection error: " + error);
  }
};

export const fetchContacts = async (
  dbSession: SQLiteDatabase,
): Promise<[ResultSet] | void> => {
  try {
    logger.info("Fetching contacts from the SQL database.");
    logger.info("Executing query.");
    const results = dbSession.executeSql(
      `SELECT contactId, name, surname, publicKey
      FROM contacts
      ORDER BY surname, name;`,
    );
    logger.info("Query executed. Returning results.");
    logger.debug("Results: " + results);
    return results;
  } catch (error) {
    logger.error("SQL db connection error: " + error);
  }
};

export const fetchMessages = async (
  dbSession: SQLiteDatabase,
  contactId: number,
): Promise<[ResultSet] | void> => {
  try {
    logger.info("Fetching messages for a specified contact from the SQL database.");
    logger.info("Executing query.");
    const results = dbSession.executeSql(
      `SELECT contactId, text, mediaPath, time
      FROM messages
      WHERE contactId = ${contactId}
      ORDER BY time;`,
    );
    logger.info("Query executed. Returning results.");
    logger.debug("Results: " + results);
    return results;
  } catch (error) {
    logger.error("SQL db connection error: " + error);
  }
};

export const insertMessage = async (
  dbSession: SQLiteDatabase,
  contactId: number,
  message: MessageItem,
): Promise<boolean> => {
  try {
    logger.info("Inserting a message to the SQL database.");
    logger.info("Executing query.");
    const results = await dbSession.executeSql(
      `INSERT INTO messages (contactId, text, mediaPath, time)
      VALUES(${contactId}, ${message.text}, ${message.mediaPath}, ${message.time});`,
    );
    logger.info("Query executed successfully.");
    logger.debug("Results: " + results);
    return true;
  } catch (error) {
    logger.error("SQL db connection error: " + error);
    return false;
  }
};
