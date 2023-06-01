import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import dbTemplateFilePath from "../../assets/SqlDbTemplate.db";
import logger from "../Logger";
import {
  GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG,
  GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG,
} from "../Messages";
import { Contact, MessageItem } from "../Types";

/**
 * Opens a connection to the SQLite database.
 */
export async function openDatabase(
  fileName: string = "SqlDbTemplate.db",
): Promise<SQLite.WebSQLDatabase | null> {
  if (Platform.OS === "web") {
    // The library does not support web.
    return null;
  }
  if (
    !(await FileSystem.getInfoAsync(FileSystem.documentDirectory + fileName)).exists
  ) {
    logger.info("Copying a template SQL database to user's documents directory.");
    await FileSystem.copyAsync({
      from: dbTemplateFilePath,
      to: FileSystem.documentDirectory + fileName,
    });
  }
  return SQLite.openDatabase(fileName);
}

export const insertContact = async (
  database: SQLite.WebSQLDatabase,
  contact: Contact,
): Promise<boolean> => {
  logger.info("Inserting a contact to the SQL database.");
  let successfulInsert = false;
  database.transaction((tx) => {
    tx.executeSql(
      `INSERT INTO contacts (name, surname, publicKey)
      VALUES(?, ?, ?);`,
      [contact.name, contact.surname, contact.publicKey],
      (txObj, resultSet) => {
        logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
        successfulInsert = true;
      },
      (txObj, error) => {
        logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
        return false;
      },
    );
  });
  return successfulInsert;
};

export const fetchChatRooms = async (db: SQLite.WebSQLDatabase): Promise<any[]> => {
  logger.info("Fetching chat rooms from the SQL database.");
  let results: any[] = [];
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT c.name, c.surname, m.time, SUM(m.unread) AS unread
       FROM (select * from messages order by time DESC) as m
       JOIN contacts AS c ON m.fk_contact_id = c.contact_id
       GROUP BY c.name, c.surname
       ORDER BY m.time DESC;`,
      [],
      (txObj, { rows: { _array } }) => {
        logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
        results = _array;
      },
      (txObj, error) => {
        logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
        return false;
      },
    );
  });
  logger.debug(`Results: ${results}`);
  return results;
};

export const fetchContacts = async (db: SQLite.WebSQLDatabase): Promise<any[]> => {
  logger.info("Fetching contacts from the SQL database.");
  let results: any[] = [];
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT contactId, name, surname, publicKey, messagingKey
      FROM contacts
      ORDER BY surname, name;`,
      [],
      (txObj, { rows: { _array } }) => {
        logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
        results = _array;
      },
      (txObj, error) => {
        logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
        return false;
      },
    );
  });
  logger.debug(`Results: ${results}`);
  return results;
};

export const fetchMessages = async (
  db: SQLite.WebSQLDatabase,
  contactId: number,
): Promise<any[]> => {
  logger.info("Fetching messages for a specified contact from the SQL database.");
  let results: any[] = [];
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT contactId, text, mediaPath, time
      FROM messages
      WHERE contactId = ?
      ORDER BY time;`,
      [contactId],
      (txObj, { rows: { _array } }) => {
        logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
        results = _array;
      },
      (txObj, error) => {
        logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
        return false;
      },
    );
  });
  logger.debug(`Results: ${results}`);
  return results;
};

export const insertMessage = async (
  database: SQLite.WebSQLDatabase,
  contactId: number,
  message: MessageItem,
): Promise<boolean> => {
  logger.info("Inserting a message to the SQL database.");
  database.transaction((tx) => {
    tx.executeSql(
      `INSERT INTO messages (fk_contact_id, text_content, media_content_path, time, unread)
      VALUES(?, ?, ?, ?, ?);`,
      [
        contactId,
        message.textContent,
        message.mediaContentPath,
        message.time.toISOString(),
        message.unread ? 1 : 0,
      ],
      (txObj, resultSet) => {
        logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
      },
      (txObj, error) => {
        logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
        return false;
      },
    );
  });
  return true;
};

export const fetchUnreadCount = async (db: SQLite.WebSQLDatabase): Promise<any[]> => {
  logger.info("Getting messages count from the SQL database.");
  let results: any[] = [];
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT COUNT(*)
      FROM messages
      WHERE unread = 1;`,
      [],
      (txObj, { rows: { _array } }) => {
        logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
        results = _array;
      },
      (txObj, error) => {
        logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
        return false;
      },
    );
  });
  logger.debug(`Results: ${results}`);
  return results;
};
