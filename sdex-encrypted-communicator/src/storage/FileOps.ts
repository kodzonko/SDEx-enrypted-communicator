import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import logger from "../Logger";

export const readFile = async (path: string): Promise<string | undefined> => {
  logger.info("Reading content from a file.");
  if (Platform.OS === "web") {
    logger.info("expo-file-system is not supported on web, returning.");
    return undefined;
  }
  return FileSystem.readAsStringAsync(path);
};

export const writeFile = async (path: string, value: string): Promise<boolean> => {
  logger.info("Writing content to a file.");
  if (Platform.OS === "web") {
    logger.info("expo-file-system is not supported on web, returning.");
    return false;
  }
  logger.debug(`Writing content=${value} to path=${path}`);
  return FileSystem.writeAsStringAsync(path, value)
    .then(() => true)
    .catch(() => false);
};

export const saveImage = (fileName: string): Promise<void> => {
  logger.info("Saving image to the device storage.");
  throw new Error("Not implemented.");
};

export const saveFileToDocumentsDirectory = async (
  fileName: string,
  content: object | string,
): Promise<boolean> => {
  logger.info("Saving a file to documents directory.");
  if (Platform.OS === "web") {
    logger.info("expo-file-system is not supported on web, returning false.");
    return false;
  }
  if (!FileSystem.documentDirectory) {
    logger.info("FileSystem.documentDirectory cannot be determined.");
    return false;
  }
  const filePath = `${FileSystem.documentDirectory}${fileName}}`;
  logger.debug(`Creating a file at path=${filePath}`);
  return writeFile(filePath, JSON.stringify(content))
    .then(() => true)
    .catch(() => false);
};

export const readFileFromDocumentsDirectory = async (
  fileName: string,
): Promise<object | string | undefined> => {
  logger.info("Reading a file from documents directory.");
  if (Platform.OS === "web") {
    logger.info("expo-file-system is not supported on web, returning.");
    return undefined;
  }
  if (!FileSystem.documentDirectory) {
    logger.info("FileSystem.documentDirectory cannot be determined, returning.");
    return undefined;
  }
  const filePath = `${FileSystem.documentDirectory}${fileName}}`;
  logger.debug(`Reading a file from path=${filePath}`);
  const content = await readFile(filePath);
  const parsedContent = content ? <object | string>JSON.parse(content) : undefined;
  logger.debug(`Returning content=${JSON.stringify(parsedContent)}`);
  return parsedContent;
};

export const saveFileToCacheDirectory = async (
  fileName: string,
  content: object | string,
): Promise<boolean> => {
  logger.info("Saving a file to cache directory.");
  if (Platform.OS === "web") {
    logger.info("expo-file-system is not supported on web, returning false.");
    return false;
  }
  if (!FileSystem.cacheDirectory) {
    logger.info("FileSystem.cacheDirectory cannot be determined.");
    return false;
  }
  const filePath = `${FileSystem.cacheDirectory}${fileName}}`;
  logger.debug(`Creating a file at path=${filePath}`);
  return writeFile(filePath, JSON.stringify(content))
    .then(() => true)
    .catch(() => false);
};

export const readFileFromCacheDirectory = async (
  fileName: string,
): Promise<object | string | undefined> => {
  logger.info("Reading a file from cache directory.");
  if (Platform.OS === "web") {
    logger.info("expo-file-system is not supported on web, returning.");
    return undefined;
  }
  if (!FileSystem.cacheDirectory) {
    logger.info("FileSystem.cacheDirectory cannot be determined, returning.");
    return undefined;
  }
  const filePath = `${FileSystem.cacheDirectory}${fileName}}`;
  logger.debug(`Reading a file from path=${filePath}`);
  const content = await readFile(filePath);
  const parsedContent = content ? <object | string>JSON.parse(content) : undefined;
  logger.debug(`Returning content=${JSON.stringify(parsedContent)}`);
  return parsedContent;
};
