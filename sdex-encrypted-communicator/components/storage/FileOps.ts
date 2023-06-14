import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { FileSystemError } from "../Errors";
import logger from "../Logger";
import { GENERIC_LOCAL_STORAGE_FILESYSTEM_ERROR_MSG } from "../Messages";

export const readFile = async (path: string): Promise<string> => {
  logger.info("Reading content from a file.");
  if (Platform.OS === "web") {
    logger.info("expo-file-system is not supported on web, returning.");
    return "";
  }
  try {
    return await FileSystem.readAsStringAsync(path);
  } catch (error) {
    logger.error(error);
    throw new FileSystemError(GENERIC_LOCAL_STORAGE_FILESYSTEM_ERROR_MSG);
  }
};

export const writeFile = async (path: string, value: string): Promise<void> => {
  logger.info("Writing content to a file..");
  if (Platform.OS === "web") {
    logger.info("expo-file-system is not supported on web, returning.");
    return;
  }
  try {
    await FileSystem.writeAsStringAsync(path, value);
  } catch (error) {
    logger.error(error);
    throw new FileSystemError(GENERIC_LOCAL_STORAGE_FILESYSTEM_ERROR_MSG);
  }
};

export const saveImage = async (fileName: string): Promise<void> => {
  logger.info("Saving image to the device storage.");
};

export const saveFileToDocumentsDirectory = async (
  fileName: string,
  content: any,
): Promise<void> => {
  logger.info("Saving image to the device storage.");
  if (Platform.OS === "web") {
    logger.info("expo-file-system is not supported on web, returning.");
    return;
  }
  const filePath = `${FileSystem.documentDirectory}${fileName}}`;
  await writeFile(filePath, JSON.stringify(content));
};

export const readFileFromDocumentsDirectory = async (
  fileName: string,
): Promise<any> => {
  if (Platform.OS === "web") {
    logger.info("expo-file-system is not supported on web, returning.");
    return;
  }
  const filePath = `${FileSystem.documentDirectory}${fileName}}`;
  const content = await readFile(filePath);
  return JSON.parse(content);
};

export const saveFileToCacheDirectory = async (
  fileName: string,
  content: any,
): Promise<void> => {
  if (Platform.OS === "web") {
    logger.info("expo-file-system is not supported on web, returning.");
    return;
  }
  const filePath = `${FileSystem.cacheDirectory}${fileName}}`;
  await writeFile(filePath, JSON.stringify(content));
};

export const readFileFromCacheDirectory = async (fileName: string): Promise<any> => {
  if (Platform.OS === "web") {
    logger.info("expo-file-system is not supported on web, returning.");
    return;
  }
  const filePath = `${FileSystem.cacheDirectory}${fileName}}`;
  const content = await readFile(filePath);
  return JSON.parse(content);
};
