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

const DEFAULT_SQLITE_DB_FILE_NAME = "SQLite-database.db";

export async function createDb(fileName = DEFAULT_SQLITE_DB_FILE_NAME): Promise<boolean> {
  if (!FileSystem.documentDirectory) {
    logger.info("FileSystem.documentDirectory cannot be determined.");
    return false;
  }
  if (!(await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite`)).exists) {
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`);
  }
  const targetPath = `${FileSystem.documentDirectory}SQLite/${fileName}`;
  logger.info("Copying a template SQL database to documents directory.");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-var-requires, global-require
  const sqlTemplateAsset = (await Asset.loadAsync(require("../../assets/SqlDbTemplate.db")))[0];
  if (!sqlTemplateAsset || !sqlTemplateAsset.localUri) {
    logger.error("Failed to load the SQL database template.");
    return false;
  }

  return FileSystem.copyAsync({
    from: sqlTemplateAsset.localUri,
    to: targetPath,
  })
    .then(() => {
      logger.info(`Successfully copied the SQL database template to: ${targetPath}`);
      return true;
    })
    .catch((error) => {
      logger.error(`Failed to copy the SQL database template. Error=${error.message}`);
      return false;
    });
}

/**
 * Opens a connection to SQLite database.
 * @param fileName The name of the database file.
 * @returns A promise that resolves to a database connection or undefined if the platform is not
 *          supported or an error has occurred when establishing connection.
 */
export async function createDbSession(
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  fileName = DEFAULT_SQLITE_DB_FILE_NAME,
): Promise<SQLite.WebSQLDatabase | undefined> {
  logger.info("Creating db session.");
  if (Platform.OS === "web") {
    logger.info("expo-sqlite is not supported on web, returning.");
    return undefined;
  }
  if (!FileSystem.documentDirectory) {
    logger.info("FileSystem.documentDirectory cannot be determined.");
    return undefined;
  }
  const filePath = `${FileSystem.documentDirectory}SQLite/${fileName}`;
  if (!(await FileSystem.getInfoAsync(filePath)).exists) {
    logger.info(`File=${FileSystem.documentDirectory}SQLite/${fileName} not found.`);
    return undefined;
  }
  logger.info(`Opening SQL database connection to: ${filePath}`);
  // Cannot pass a **path** to session constructor. It only accepts **file name** and opens/creates db file under: ${FileSystem.documentDirectory}SQLite/<fileName>
  const session = SQLite.openDatabase(fileName);
  session.exec([{ sql: "PRAGMA foreign_keys = ON;", args: [] }], false, (error, result) => {
    if (error) {
      logger.error(
        `Error occurred when activating foreign keys in the db. Error: ${error.message}`,
      );
    }
    logger.info("Foreign keys turned on");
  });
  session.exec(
    [
      {
        sql: `CREATE VIEW IF NOT EXISTS
                  all_contacts_with_messages_except_first_party
              AS
              SELECT DISTINCT
                  contact_id, name, surname
              FROM
                  contacts AS c
              INNER JOIN
                  messages AS m ON c.contact_id = m.contact_id_from OR c.contact_id = m.contact_id_to
              WHERE
                  c.contact_id != 0;

              CREATE VIEW IF NOT EXISTS
                  all_messages_by_third_parties
              AS
              SELECT
                  c.contact_id, c.name, c.surname, m.unread, m.created_at
              FROM
                  all_contacts_with_messages_except_first_party AS c
              JOIN
                  messages AS m ON c.contact_id = m.contact_id_to OR c.contact_id = m.contact_id_from
              ORDER BY
                  created_at DESC;`,
        args: [],
      },
    ],
    false,
    (error, result) => {
      if (error) {
        logger.error(
          `Error occurred when creating views for chat rooms select query. Error: ${error.message}`,
        );
      }
      logger.info("Views for chat rooms select query created.");
    },
  );
  return session;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const getContactsQuery = async (dbSession: SQLite.WebSQLDatabase): Promise<any[]> => {
  logger.info("Executing query to get contacts from SQL database.");
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor, @typescript-eslint/require-await */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.readTransaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `SELECT
            contact_id, name, surname
      FROM
          contacts
      ORDER BY
          surname, name;`,
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
        `SELECT name, surname, public_key
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

export const getContactByPublicKeyQuery = async (
  publicKey: string,
  dbSession: SQLite.WebSQLDatabase,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
): Promise<any[]> => {
  logger.info("Executing query to get a contact by public key from SQL database.");
  /* eslint-disable-next-line no-async-promise-executor, @typescript-eslint/require-await, @typescript-eslint/no-misused-promises */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.readTransaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `SELECT name, surname, contact_id
      FROM contacts
      WHERE public_key = ?;`,
        [publicKey],
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

export const addContactQuery = async (
  contact: Contact,
  dbSession: SQLite.WebSQLDatabase,
): Promise<SQLite.SQLResultSet> => {
  logger.info("Executing a query to insert a contact to SQL database.");
  let query: string;
  let args: (string | number)[] = [];
  if (contact.id !== undefined) {
    query = `INSERT INTO contacts (name, surname, public_key, contact_id)
    VALUES(?, ?, ?, ?);`;
    args = [contact.name, contact.surname, contact.publicKey, contact.id];
  } else {
    query = `INSERT INTO contacts (name, surname, public_key)
    VALUES(?, ?, ?);`;
    args = [contact.name, contact.surname, contact.publicKey];
  }

  /* eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor, @typescript-eslint/require-await */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.transaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        query,
        args,
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

export const updateContactQuery = async (
  contact: Contact,
  dbSession: SQLite.WebSQLDatabase,
): Promise<SQLite.SQLResultSet> => {
  logger.info("Executing query to update contact in SQL database.");
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor, @typescript-eslint/require-await */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.transaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `UPDATE contacts
        SET name = ?, surname = ?, public_key = ?
        WHERE contact_id = ?
      ;`,
        [contact.name, contact.surname, contact.publicKey, <number>contact.id],
        (_, resultSet) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(resultSet)}`);
          resolve(resultSet);
        },
        (_, error) => {
          logger.error(`Transaction updating a contact returned error. Error=${error.message}`);
          reject(new SqlDatabaseError(`Transaction failed. Error=${error.message}`));
          return false;
        },
      );
    }),
  );
};

export const removeContactQuery = async (
  contactId: number,
  dbSession: SQLite.WebSQLDatabase,
): Promise<SQLite.SQLResultSet> => {
  logger.info("Executing query to delete contact from SQL database.");
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor, @typescript-eslint/require-await */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.transaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `DELETE FROM contacts
      WHERE contact_id = ?;`,
        [contactId],
        (_, resultSet) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(resultSet)}`);
          resolve(resultSet);
        },
        (_, error) => {
          logger.error(`Transaction deleting a contact returned error. Error=${error.message}`);
          reject(new SqlDatabaseError(`Transaction failed. Error=${error.message}`));
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
        `SELECT
            contact_id, name, surname, created_at AS last_message_date, SUM(unread)
        AS
            unread_message_count
        FROM
            all_messages_by_third_parties
        GROUP BY
            contact_id;`,
        //   `SELECT c.contact_id, c.name, c.surname, m.created_at AS last_message_date, SUM(m.unread) AS unread_message_count
        //  FROM (select * from messages ORDER BY created_at DESC) as m
        //  JOIN contacts AS c ON m.contact_id_from = c.contact_id OR m.contact_id_to = c.contact_id
        //  GROUP BY c.name, c.surname
        //  ORDER BY m.created_at DESC;`,
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
        `SELECT message_id, contact_id_from, contact_id_to, text, created_at, unread, image, video, audio
      FROM messages
      WHERE contact_id_from = ? OR contact_id_to = ?
      ORDER BY created_at DESC;`,
        [contactId, contactId],
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

export const addMessageQuery = async (
  message: Message,
  dbSession: SQLite.WebSQLDatabase,
): Promise<SQLite.SQLResultSet> => {
  logger.info("Executing query to insert a message to SQL database.");
  logger.debug(`Inserting message=${JSON.stringify(message)}`);
  /* eslint-disable-next-line no-async-promise-executor, @typescript-eslint/require-await, @typescript-eslint/no-misused-promises */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.transaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `INSERT INTO messages (contact_id_from, contact_id_to, text, created_at, unread, image, video, audio)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          message.contactIdFrom,
          message.contactIdTo,
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

export const markMessagesAsReadQuery = async (
  messageIds: number[],
  dbSession: SQLite.WebSQLDatabase,
): Promise<SQLite.SQLResultSet> => {
  logger.info("Executing query to mark messages as unread in SQL database.");
  /* eslint-disable-next-line no-async-promise-executor, @typescript-eslint/require-await, @typescript-eslint/no-misused-promises */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.transaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `UPDATE
            messages
            SET unread = 0
            WHERE message_id IN (?);`,
        [messageIds.join(", ")],
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
