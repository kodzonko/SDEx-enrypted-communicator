import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import logger from "../Logger";
import {
  GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG,
  GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG,
} from "../Messages";
import { Contact, Message } from "../Types";

/**
 * Opens a connection to SQLite database.
 *
 * @returns A promise that resolves to a database connection or undefined if the platform is not supported.
 */
export async function openDatabase(
  fileName: string = "SqlDbTemplate.db",
): Promise<SQLite.WebSQLDatabase | undefined> {
  logger.info("Opening SQL database connection.");
  if (Platform.OS === "web") {
    logger.info("expo-sqlite is not supported on web, returning.");
    return;
  }
  const targetPath = FileSystem.documentDirectory + "/SQLite/" + fileName;
  if (!(await FileSystem.getInfoAsync(targetPath)).exists) {
    logger.info(`File ${targetPath} not found.`);
    logger.info(
      `Copying a template SQL database to documents directory (${
        FileSystem.documentDirectory + "/SQLite/"
      }).`,
    );
    const sqlTemplateAsset = (
      await Asset.loadAsync(require("../../assets/SqlDbTemplate.db"))
    )[0];
    if (!sqlTemplateAsset || !sqlTemplateAsset.localUri) {
      logger.error("Failed to load the SQL database template.");
      return;
    }
    await FileSystem.copyAsync({
      from: sqlTemplateAsset.localUri,
      to: targetPath,
    });
    logger.info(`Successfully copied the SQL database template to ${targetPath}.`);
  }
  return SQLite.openDatabase(fileName);
}

export const saveContactQuery = async (
  dbSession: SQLite.WebSQLDatabase,
  contact: Contact,
): Promise<boolean> => {
  logger.info("Inserting a contact to SQL database.");
  let successfulInsert = false;
  dbSession.transaction((tx) => {
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

export const getChatRoomsQuery = async (
  dbSession: SQLite.WebSQLDatabase,
): Promise<any[]> => {
  logger.info("Fetching chat rooms from SQL database.");
  let results: any[] = [];
  dbSession.transaction((tx) => {
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
  logger.debug(`Query results: ${JSON.stringify(results)}`);
  return results;
};

export const getContactsQuery = async (
  dbSession: SQLite.WebSQLDatabase,
): Promise<any[]> => {
  logger.info("Fetching contacts from the SQL database.");
  let results: any[] = [];
  dbSession.transaction((tx) => {
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
  logger.debug(`Query results: ${JSON.stringify(results)}`);
  return results;
};

export const getContactByIdQuery = async (
  dbSession: SQLite.WebSQLDatabase,
  contactId: number,
): Promise<any> => {
  logger.info("Querying for a contact by id from the SQL database.");
  let results: any[] = [];
  dbSession.transaction((tx) => {
    tx.executeSql(
      `SELECT contactId, name, surname, publicKey, messagingKey
      FROM contacts
      WHERE contactId = ?;`,
      [contactId.toString()],
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
  logger.debug(`Query results: ${JSON.stringify(results)}`);
  return results[0];
};

export const getMessagesQuery = async (
  dbSession: SQLite.WebSQLDatabase,
  contactId: number,
): Promise<any[]> => {
  logger.info("Fetching messages for a specified contact from SQL database.");
  let results: any[] = [];
  dbSession.transaction((tx) => {
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
  logger.debug(`Query results: ${JSON.stringify(results)}`);
  return results;
};

export const saveMessageQuery = async (
  dbSession: SQLite.WebSQLDatabase,
  message: Message,
): Promise<boolean> => {
  logger.info("Inserting a message to the SQL database.");
  dbSession.transaction((tx) => {
    tx.executeSql(
      `INSERT INTO messages (fk_contact_id, text, created_at, unread, image, video, audio)
      VALUES(?, ?, ?, ?, ?);`,
      [
        message.contactId,
        message.text,
        message.createdAt.toISOString(),
        message.unread ? 1 : 0,
        message.image ? message.image : null,
        message.video ? message.video : null,
        message.audio ? message.audio : null,
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

export const getUnreadCountQuery = async (
  dbSession: SQLite.WebSQLDatabase,
): Promise<any[]> => {
  logger.info("Getting messages count from SQL database.");
  let results: any[] = [];
  dbSession.transaction((tx) => {
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
  logger.debug(`Query results: ${JSON.stringify(results)}`);
  return results;
};
