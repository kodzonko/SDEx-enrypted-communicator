import * as SecureStore from "expo-secure-store";
import logger from "../Logger";
import { GENERIC_LOCAL_STORAGE_SECURESTORE_ERROR_MSG } from "../Messages";

export const saveSecure = async (key: string, value: object): Promise<void> => {
  const valueStringified = JSON.stringify(value);
  await SecureStore.setItemAsync(key, valueStringified).catch((error) => {
    logger.error(GENERIC_LOCAL_STORAGE_SECURESTORE_ERROR_MSG + error);
  });
};

export const getSecure = async (key: string): Promise<object | null> => {
  try {
    const value = await SecureStore.getItemAsync(key);
    return value !== null ? JSON.parse(value) : value;
  } catch (error) {
    logger.error(GENERIC_LOCAL_STORAGE_SECURESTORE_ERROR_MSG + error);
    return null;
  }
};

export const deleteSecure = async (key: string): Promise<void> => {
  await SecureStore.deleteItemAsync(key).catch((error) => {
    logger.error(GENERIC_LOCAL_STORAGE_SECURESTORE_ERROR_MSG + error);
  });
};
