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
 * @param fileName The name of the database file.
 * @returns A promise that resolves to a database connection or undefined if the platform is not
 *          supported or an error has occurred when establishing connection.
 */
export async function createDbSession(
  fileName = "SqlDbTemplate.db",
): Promise<SQLite.WebSQLDatabase | undefined> {
  logger.info("Opening SQL database connection.");
  if (Platform.OS === "web") {
    logger.info("expo-sqlite is not supported on web, returning.");
    return;
  }
  const targetPath = `${FileSystem.documentDirectory}/SQLite/${fileName}`;
  if (!(await FileSystem.getInfoAsync(targetPath)).exists) {
    logger.info(`File ${targetPath} not found.`);
    logger.info(
      `Copying a template SQL database to documents directory (${`${FileSystem.documentDirectory}/SQLite/`}).`,
    );
    const sqlTemplateAsset = (await Asset.loadAsync(require("../../assets/SqlDbTemplate.db")))[0];
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
  contact: Contact,
  dbSession: SQLite.WebSQLDatabase,
): Promise<SQLite.SQLResultSet> => {
  logger.info("Executing a query to insert a contact to SQL database.");
  return new Promise(async (resolve, reject) =>
    dbSession.transaction(async (tx) => {
      await tx.executeSql(
        `INSERT INTO contacts (name, surname, public_key, messaging_key)
      VALUES(?, ?, ?, ?);`,
        [contact.name, contact.surname, contact.publicKey, contact.messagingKey],
        (txObj, resultSet) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(resultSet)}`);
          resolve(resultSet);
        },
        (txObj, error) => {
          logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
          reject("Transaction failed:" + error.message);
          return false;
        },
      );
    }),
  );
};

export const getChatRoomsQuery = async (dbSession: SQLite.WebSQLDatabase): Promise<any[]> => {
  logger.info("Executing query to get chat rooms from SQL database.");
  return new Promise(async (resolve, reject) =>
    dbSession.readTransaction(async (tx) => {
      await tx.executeSql(
        `SELECT c.name, c.surname, m.created_at AS last_message_date, SUM(m.unread) AS unread_message_count
       FROM (select * from messages ORDER BY created_at DESC) as m
       JOIN contacts AS c ON m.fk_contact_id = c.contact_id
       GROUP BY c.name, c.surname
       ORDER BY m.created_at DESC;`,
        [],
        (tx, { rows: { _array } }) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(_array)}`);
          resolve(_array);
        },
        (tx, error) => {
          logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
          reject("Transaction failed:" + error.message);
          return false;
        },
      );
    }),
  );
};

export const getContactsQuery = async (dbSession: SQLite.WebSQLDatabase): Promise<any[]> => {
  logger.info("Executing query to get contacts from SQL database.");
  return new Promise(async (resolve, reject) =>
    dbSession.readTransaction(async (tx) => {
      await tx.executeSql(
        `SELECT contact_id, name, surname, public_key, messaging_key
      FROM contacts
      ORDER BY surname, name;`,
        [],
        (tx, { rows: { _array } }) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(_array)}`);
          resolve(_array);
        },
        (tx, error) => {
          logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
          reject("Transaction failed:" + error.message);
          return false;
        },
      );
    }),
  );
};

export const getMessagesByContactIdQuery = async (
  contactId: number,
  dbSession: SQLite.WebSQLDatabase,
): Promise<any[]> => {
  logger.info("Executing query to get messages for a specified contact from SQL database.");
  return new Promise(async (resolve, reject) =>
    dbSession.readTransaction(async (tx) => {
      await tx.executeSql(
        `SELECT message_id, fk_contact_id, text, created_at, unread, image, video, audio
      FROM messages
      WHERE fk_contact_id = ?
      ORDER BY created_at;`,
        [contactId],
        (tx, { rows: { _array } }) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(_array)}`);
          resolve(_array);
        },
        (tx, error) => {
          logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
          reject("Transaction failed:" + error.message);
          return false;
        },
      );
    }),
  );
};

export const getContactByIdQuery = async (
  contactId: number,
  dbSession: SQLite.WebSQLDatabase,
): Promise<any[]> => {
  logger.info("Executing query to get a contact by id from SQL database.");
  return new Promise(async (resolve, reject) =>
    dbSession.readTransaction(async (tx) => {
      await tx.executeSql(
        `SELECT contact_id, name, surname, public_key, messaging_key
      FROM contacts
      WHERE contact_id = ?;`,
        [contactId],
        (tx, { rows: { _array } }) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(_array)}`);
          resolve(_array);
        },
        (tx, error) => {
          logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
          reject("Transaction failed:" + error.message);
          return false;
        },
      );
    }),
  );
};

export const saveMessageQuery = async (
  message: Message,
  dbSession: SQLite.WebSQLDatabase,
): Promise<SQLite.SQLResultSet> => {
  logger.info("Executing query to insert a message to SQL database.");
  return new Promise(async (resolve, reject) =>
    dbSession.transaction(async (tx) => {
      await tx.executeSql(
        `INSERT INTO messages (fk_contact_id, text, created_at, unread, image, video, audio)
      VALUES(?, ?, ?, ?, ?, ?, ?);`,
        [
          message.contactId,
          message.text,
          message.createdAt.toISOString(),
          message.unread ? 1 : 0,
          message.image ? message.image : null,
          message.video ? message.video : null,
          message.audio ? message.audio : null,
        ],
        (tx, resultSet) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(resultSet)}`);
          resolve(resultSet);
        },
        (tx, error) => {
          logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
          reject("Transaction failed:" + error.message);
          return false;
        },
      );
    }),
  );
};

export const getUnreadCountQuery = async (dbSession: SQLite.WebSQLDatabase): Promise<any[]> => {
  logger.info("Getting messages count from SQL database.");
  return new Promise(async (resolve, reject) =>
    dbSession.readTransaction(async (tx) => {
      await tx.executeSql(
        `SELECT COUNT(*) AS count
      FROM messages
      WHERE unread = 1;`,
        [],
        (tx, { rows: { _array } }) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(_array)}`);
          resolve(_array);
        },
        (tx, error) => {
          logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
          reject("Transaction failed:" + error.message);
          return false;
        },
      );
    }),
  );
};
