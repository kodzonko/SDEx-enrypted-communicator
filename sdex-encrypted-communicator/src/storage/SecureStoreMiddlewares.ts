import * as SecureStore from "expo-secure-store";
import logger from "../Logger";
import { GENERIC_LOCAL_STORAGE_SECURESTORE_ERROR_MSG } from "../Messages";

/**
 * Saves key: value pair to SecureStore
 * @param key - key of an entry to save
 * @param value - JSON-stringified value to save
 * @returns true if successful, false otherwise
 */
export const saveSecure = async (key: string, value: object | string): Promise<boolean> => {
  const valueStringified = JSON.stringify(value);
  return SecureStore.setItemAsync(key, valueStringified)
    .then(() => true)
    .catch((error: Error) => {
      logger.error(GENERIC_LOCAL_STORAGE_SECURESTORE_ERROR_MSG + error.message);
      return false;
    });
};

/**
 * Gets entry from SecureStore by key
 * @param key - key of an entry to get
 * @returns JSON-parsed object if successful (and entry found), undefined otherwise
 */
export const getSecure = async (key: string): Promise<object | string | undefined> => {
  const value = await SecureStore.getItemAsync(key);
  return value !== null ? <object | string>JSON.parse(value) : undefined;
};

/**
 * Removes entry from SecureStore by key
 * @param key - key of an entry to remove
 * @returns true if successful, false otherwise
 */
export const deleteSecure = async (key: string): Promise<boolean> =>
  SecureStore.deleteItemAsync(key)
    .then(() => true)
    .catch((error: Error) => {
      logger.error(GENERIC_LOCAL_STORAGE_SECURESTORE_ERROR_MSG + error.message);
      return false;
    });
