import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import { SqlDatabaseError } from "../Errors";
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
    return undefined;
  }
  if (!FileSystem.documentDirectory) {
    logger.info("FileSystem.documentDirectory cannot be determined.");
    return undefined;
  }
  const targetPath = `${FileSystem.documentDirectory}/SQLite/${fileName}`;
  if (!(await FileSystem.getInfoAsync(targetPath)).exists) {
    logger.info(`File ${targetPath} not found.`);
    logger.info(
      `Copying a template SQL database to documents directory (${`${FileSystem.documentDirectory}/SQLite/`}).`,
    );
    /* eslint-disable-next-line global-require, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-var-requires */
    const sqlTemplateAsset = (await Asset.loadAsync(require("../../assets/SqlDbTemplate.db")))[0];
    if (!sqlTemplateAsset || !sqlTemplateAsset.localUri) {
      logger.error("Failed to load the SQL database template.");
      return undefined;
    }
    await FileSystem.copyAsync({
      from: sqlTemplateAsset.localUri,
      to: targetPath,
    });
    logger.info(`Successfully copied the SQL database template to ${targetPath}.`);
  }
  logger.info(`Opening SQL database connection to ${targetPath}.`);
  return SQLite.openDatabase(fileName);
}

export const saveContactQuery = async (
  contact: Contact,
  dbSession: SQLite.WebSQLDatabase,
): Promise<SQLite.SQLResultSet> => {
  logger.info("Executing a query to insert a contact to SQL database.");
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor, @typescript-eslint/require-await */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.transaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `INSERT INTO contacts (name, surname, public_key, messaging_key)
      VALUES(?, ?, ?, ?);`,
        [contact.name, contact.surname, contact.publicKey, contact.messagingKey],
        (_, resultSet) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(resultSet)}`);
          resolve(resultSet);
        },
        (_, error) => {
          logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
          reject(new SqlDatabaseError(`Transaction failed:${error.message}`));
          return false;
        },
      );
    }),
  );
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const getChatRoomsQuery = async (dbSession: SQLite.WebSQLDatabase): Promise<any[]> => {
  logger.info("Executing query to get chat rooms from SQL database.");
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor, @typescript-eslint/require-await */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.readTransaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `SELECT c.contact_id, c.name, c.surname, m.created_at AS last_message_date, SUM(m.unread) AS unread_message_count
       FROM (select * from messages ORDER BY created_at DESC) as m
       JOIN contacts AS c ON m.fk_contact_id = c.contact_id
       GROUP BY c.name, c.surname
       ORDER BY m.created_at DESC;`,
        [],
        (_, { rows: { _array } }) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(_array)}`);
          resolve(_array);
        },
        (_, error) => {
          logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
          reject(new SqlDatabaseError(`Transaction failed:${error.message}`));
          return false;
        },
      );
    }),
  );
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const getContactsQuery = async (dbSession: SQLite.WebSQLDatabase): Promise<any[]> => {
  logger.info("Executing query to get contacts from SQL database.");
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor, @typescript-eslint/require-await */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.readTransaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `SELECT contact_id, name, surname
      FROM contacts
      ORDER BY surname, name;`,
        [],
        (_, { rows: { _array } }) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(_array)}`);
          resolve(_array);
        },
        (_, error) => {
          logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
          reject(new SqlDatabaseError(`Transaction failed:${error.message}`));
          return false;
        },
      );
    }),
  );
};

export const getMessagesByContactIdQuery = async (
  contactId: number,
  dbSession: SQLite.WebSQLDatabase,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
): Promise<any[]> => {
  logger.info("Executing query to get messages for a specified contact from SQL database.");
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor, @typescript-eslint/require-await */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.readTransaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `SELECT message_id, fk_contact_id, text, created_at, unread, image, video, audio
      FROM messages
      WHERE fk_contact_id = ?
      ORDER BY created_at;`,
        [contactId],
        (_, { rows: { _array } }) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(_array)}`);
          resolve(_array);
        },
        (_, error) => {
          logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
          reject(new SqlDatabaseError(`Transaction failed:${error.message}`));
          return false;
        },
      );
    }),
  );
};

export const getContactByIdQuery = async (
  contactId: number,
  dbSession: SQLite.WebSQLDatabase,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
): Promise<any[]> => {
  logger.info("Executing query to get a contact by id from SQL database.");
  /* eslint-disable-next-line no-async-promise-executor, @typescript-eslint/require-await, @typescript-eslint/no-misused-promises */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.readTransaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `SELECT contact_id, name, surname, public_key, messaging_key
      FROM contacts
      WHERE contact_id = ?;`,
        [contactId],
        (_, { rows: { _array } }) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(_array)}`);
          resolve(_array);
        },
        (_, error) => {
          logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
          reject(new SqlDatabaseError(`Transaction failed:${error.message}`));
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
  /* eslint-disable-next-line no-async-promise-executor, @typescript-eslint/require-await, @typescript-eslint/no-misused-promises */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.transaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
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
        (_, resultSet) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(resultSet)}`);
          resolve(resultSet);
        },
        (_, error) => {
          logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
          reject(new SqlDatabaseError(`Transaction failed:${error.message}`));
          return false;
        },
      );
    }),
  );
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const getUnreadCountQuery = async (dbSession: SQLite.WebSQLDatabase): Promise<any[]> => {
  logger.info("Getting messages count from SQL database.");
  /* eslint-disable-next-line no-async-promise-executor, @typescript-eslint/require-await, @typescript-eslint/no-misused-promises */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.readTransaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `SELECT COUNT(*) AS count
      FROM messages
      WHERE unread = 1;`,
        [],
        (_, { rows: { _array } }) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(_array)}`);
          resolve(_array);
        },
        (_, error) => {
          logger.error(GENERIC_LOCAL_STORAGE_SQL_QUERY_FAILURE_MSG, error.message);
          reject(new SqlDatabaseError(`Transaction failed:${error.message}`));
          return false;
        },
      );
    }),
  );
};
