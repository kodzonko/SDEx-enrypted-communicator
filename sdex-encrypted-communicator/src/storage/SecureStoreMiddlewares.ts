import * as SecureStore from "expo-secure-store";
import logger from "../Logger";

/**
 * Saves key: value pair to SecureStore
 * @param key - key of an entry to save
 * @param value - JSON-stringified value to save
 * @returns true if successful, false otherwise
 */
export const saveSecure = async (key: string, value: object | string): Promise<boolean> => {
  logger.info("Saving value in SecureStore");
  return SecureStore.setItemAsync(key, JSON.stringify(value))
    .then(() => {
      logger.info("Value saved successfully in SecureStore.");
      return true;
    })
    .catch((error: Error) => {
      logger.error(`Failed to save value in SecureStore. Error=${error.message}`);
      return false;
    });
};
/**
 * Gets entry from SecureStore by key
 * @param key - key of an entry to get
 * @returns JSON-parsed object if successful (and entry found), undefined otherwise
 */
export const getSecure = async (key: string): Promise<object | string | undefined> => {
  logger.info("Getting data from SecureStore.");
  const value = await SecureStore.getItemAsync(key);
  logger.debug(`Retrieved from SecureStore; value=${JSON.stringify(value)}`);
  return value !== null ? <object | string>JSON.parse(value) : undefined;
};

/**
 * Removes entry from SecureStore by key
 * @param key - key of an entry to remove
 * @returns true if successful, false otherwise
 */
export const deleteSecure = async (key: string): Promise<boolean> => {
  logger.info("Deleting data from SecureStore.");
  return SecureStore.deleteItemAsync(key)
    .then(() => {
      logger.info("Deleted value successfully.");
      return true;
    })
    .catch((error: Error) => {
      logger.error(`Failed to delete value from SecureStore. Error=${error.message}`);
      return false;
    });
};
