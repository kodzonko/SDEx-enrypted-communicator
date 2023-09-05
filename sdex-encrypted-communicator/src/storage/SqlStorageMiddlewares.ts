import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import { PreconditionError, SqlDatabaseError } from "../Errors";
import logger from "../Logger";
import { GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG } from "../Messages";
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
    .catch((error: any) => {
      logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Failed to copy the SQL database template. Error=${JSON.stringify(error.message)}`,
      );
      return false;
    });
}

/**
 * Opens a connection to SQLite database.
 * @param fileName The name of the database file.
 * @returns A promise that resolves to a database connection.
 * @throws {PreconditionError} If the platform is not supported or path to the database file cannot be determined.
 */
export async function createDbSession(
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  fileName = DEFAULT_SQLITE_DB_FILE_NAME,
): Promise<SQLite.WebSQLDatabase> {
  logger.info("Creating db session.");
  if (Platform.OS === "web") {
    logger.error("expo-sqlite is not supported on web, returning.");
    throw new PreconditionError(`Unsupported platform: ${Platform.OS}`);
  }

  if (!FileSystem.documentDirectory) {
    logger.error("FileSystem.documentDirectory cannot be determined.");
    logger.debug(`FileSystem.documentDirectory=${JSON.stringify(FileSystem.documentDirectory)}`);
    throw new PreconditionError("FileSystem.documentDirectory cannot be determined.");
  }
  const filePath = `${FileSystem.documentDirectory}SQLite/${fileName}`;
  if (!(await FileSystem.getInfoAsync(filePath)).exists) {
    logger.error(`File=${FileSystem.documentDirectory}SQLite/${fileName} not found.`);
    throw new PreconditionError("Database file not found.");
  }
  logger.info(`Opening SQL database connection to: ${filePath}`);
  // Cannot pass a **path** to session constructor. It only accepts **file name** and opens/creates db file under: ${FileSystem.documentDirectory}SQLite/<fileName>
  const session = SQLite.openDatabase(fileName);
  session.exec([{ sql: "PRAGMA foreign_keys = ON;", args: [] }], false, (error) => {
    if (error) {
      logger.error(
        "Error in SQL execution of createDbSession. Turning on foreign keys in PRAGMA failed.",
      );
      throw new SqlDatabaseError(`Transaction failed: ${error.message}`);
    } else {
      logger.info("Foreign keys turned on.");
    }
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
    (error) => {
      if (error) {
        logger.error(
          "Error in SQL execution of createDbSession. Creation of views for chat rooms select query failed.",
        );
        throw new SqlDatabaseError(`Transaction failed: ${error.message}`);
      } else {
        logger.info("Views for chat rooms select query created.");
      }
    },
  );
  return session;
}

export async function getContactsQuery(dbSession: SQLite.WebSQLDatabase): Promise<any[]> {
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
          logger.error("Error in SQL execution of getContactsQuery");
          reject(new SqlDatabaseError(`Transaction failed: ${error.message}`));
          return false;
        },
      );
    }),
  );
}

export async function getContactByIdQuery(
  contactId: number,
  dbSession: SQLite.WebSQLDatabase,
): Promise<any[]> {
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
          logger.error("Error in SQL execution of getContactByIdQuery");
          reject(new SqlDatabaseError(`Transaction failed: ${error.message}`));
          return false;
        },
      );
    }),
  );
}

export async function getContactByPublicKeyQuery(
  publicKey: string,
  dbSession: SQLite.WebSQLDatabase,
): Promise<any[]> {
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
          logger.error("Error in SQL execution of getContactByPublicKeyQuery");
          reject(new SqlDatabaseError(`Transaction failed: ${error.message}`));
          return false;
        },
      );
    }),
  );
}

export async function addContactQuery(
  contact: Contact,
  dbSession: SQLite.WebSQLDatabase,
): Promise<SQLite.SQLResultSet> {
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
          logger.error("Error in SQL execution of addContactQuery");
          reject(new SqlDatabaseError(`Transaction failed: ${error.message}`));
          return false;
        },
      );
    }),
  );
}

export async function updateContactQuery(
  contact: Contact,
  dbSession: SQLite.WebSQLDatabase,
): Promise<SQLite.SQLResultSet> {
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
          logger.error("Error in SQL execution of updateContactQuery");
          reject(new SqlDatabaseError(`Transaction failed: ${error.message}`));
          return false;
        },
      );
    }),
  );
}

export async function removeContactQuery(
  contactId: number,
  dbSession: SQLite.WebSQLDatabase,
): Promise<SQLite.SQLResultSet> {
  logger.info("Executing query to delete contact from SQL database.");
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor, @typescript-eslint/require-await */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.transaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `DELETE FROM
                          contacts
                      WHERE
                          contact_id = ?;`,
        [contactId],
        (_, resultSet) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(resultSet)}`);
          resolve(resultSet);
        },
        (_, error) => {
          logger.error("Error in SQL execution of removeContactQuery");
          reject(new SqlDatabaseError(`Transaction failed: ${error.message}`));
          return false;
        },
      );
    }),
  );
}

export async function getChatRoomsQuery(dbSession: SQLite.WebSQLDatabase): Promise<any[]> {
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
        [],
        (_, { rows: { _array } }) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(_array)}`);
          resolve(_array);
        },
        (_, error) => {
          logger.error("Error in SQL execution of getChatRoomsQuery");
          reject(new SqlDatabaseError(`Transaction failed: ${error.message}`));
          return false;
        },
      );
    }),
  );
}

export async function getMessagesByContactIdQuery(
  contactId: number,
  dbSession: SQLite.WebSQLDatabase,
): Promise<any[]> {
  logger.info("Executing query to get messages for a specified contact from SQL database.");
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor, @typescript-eslint/require-await */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.readTransaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `SELECT
                          message_id, contact_id_from, contact_id_to, text, created_at, unread, image, video, audio
                      FROM
                          messages
                      WHERE
                          contact_id_from = ? OR contact_id_to = ?
                      ORDER BY
                          created_at DESC;`,
        [contactId, contactId],
        (_, { rows: { _array } }) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(_array)}`);
          resolve(_array);
        },
        (_, error) => {
          logger.error("Error in SQL execution of getMessagesByContactIdQuery");
          reject(new SqlDatabaseError(`Transaction failed: ${error.message}`));
          return false;
        },
      );
    }),
  );
}

export async function getUnreadCountQuery(dbSession: SQLite.WebSQLDatabase): Promise<any[]> {
  logger.info("Getting messages count from SQL database.");
  /* eslint-disable-next-line no-async-promise-executor, @typescript-eslint/require-await, @typescript-eslint/no-misused-promises */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.readTransaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `SELECT
                          COUNT(*) AS count
                      FROM
                          messages
                      WHERE
                          unread = 1;`,
        [],
        (_, { rows: { _array } }) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(_array)}`);
          resolve(_array);
        },
        (_, error) => {
          logger.error("Error in SQL execution of getUnreadCountQuery");
          reject(new SqlDatabaseError(`Transaction failed: ${error.message}`));
          return false;
        },
      );
    }),
  );
}

export async function addMessageQuery(
  message: Message,
  dbSession: SQLite.WebSQLDatabase,
): Promise<SQLite.SQLResultSet> {
  logger.info("Executing query to insert a message to SQL database.");
  logger.debug(`Inserting message=${JSON.stringify(message)}`);
  /* eslint-disable-next-line no-async-promise-executor, @typescript-eslint/require-await, @typescript-eslint/no-misused-promises */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.transaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `INSERT INTO
                          messages (contact_id_from, contact_id_to, text, created_at, unread, image, video, audio)
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
          logger.error("Error in SQL execution of addMessageQuery");
          reject(new SqlDatabaseError(`Transaction failed: ${error.message}`));
          return false;
        },
      );
    }),
  );
}

export async function markMessagesAsReadQuery(
  thirdPartyContactId: number,
  dbSession: SQLite.WebSQLDatabase,
): Promise<boolean> {
  logger.info("Executing query to mark messages as unread in SQL database.");
  /* eslint-disable-next-line no-async-promise-executor, @typescript-eslint/require-await, @typescript-eslint/no-misused-promises */
  return new Promise(async (resolve, reject) =>
    /* eslint-disable-next-line no-promise-executor-return, @typescript-eslint/no-misused-promises */
    dbSession.transaction(async (tx) => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable */
      await tx.executeSql(
        `UPDATE
                          messages
                      SET
                          unread = 0
                      WHERE
                          contact_id_from = ? OR contact_id_to = ?;`,
        [thirdPartyContactId, thirdPartyContactId],
        (_, resultSet) => {
          logger.info(GENERIC_LOCAL_STORAGE_SQL_QUERY_SUCCESS_MSG);
          logger.debug(`Query results: ${JSON.stringify(resultSet)}`);
          resolve(true);
        },
        (_, error) => {
          logger.error("Error in SQL execution of markMessagesAsReadQuery");
          reject(new SqlDatabaseError(`SQL Transaction failed: ${error.message}`));
          return false;
        },
      );
    }),
  );
}
