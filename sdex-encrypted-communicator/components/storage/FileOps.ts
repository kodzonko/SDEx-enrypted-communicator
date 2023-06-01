import * as FileSystem from "expo-file-system";
import { FileSystemError } from "../Errors";
import logger from "../Logger";
import { GENERIC_LOCAL_STORAGE_FILESYSTEM_ERROR_MSG } from "../Messages";

export const readFile = async (path: string): Promise<string> => {
  logger.info("Reading from a file.");
  try {
    return await FileSystem.readAsStringAsync(path);
  } catch (error) {
    logger.error(error);
    throw new FileSystemError(GENERIC_LOCAL_STORAGE_FILESYSTEM_ERROR_MSG);
  }
};

export const writeFile = async (path: string, value: string): Promise<void> => {
  logger.info(`Writing to a file: "${path}".`);
  try {
    await FileSystem.writeAsStringAsync(path, value);
  } catch (error) {
    logger.error(error);
    throw new FileSystemError(GENERIC_LOCAL_STORAGE_FILESYSTEM_ERROR_MSG);
  }
};

export const saveImage = async (fileName: string): Promise<void> => {
  logger.info("Saving image to the device storage.");
  FileSystem.StorageAccessFramework;
};

export const saveFileToDocumentsDirectory = async (
  fileName: string,
  content: object,
): Promise<void> => {
  const filePath = `${FileSystem.documentDirectory}${fileName}}`;
  await writeFile(filePath, JSON.stringify(content));
};

export const readFileFromDocumentsDirectory = async (
  fileName: string,
): Promise<object> => {
  const filePath = `${FileSystem.documentDirectory}${fileName}}`;
  let content = await readFile(filePath);
  return JSON.parse(content);
};

export const saveFileToCacheDirectory = async (
  fileName: string,
  content: object,
): Promise<void> => {
  const filePath = `${FileSystem.cacheDirectory}${fileName}}`;
  await writeFile(filePath, JSON.stringify(content));
};

export const readFileFromCacheDirectory = async (fileName: string): Promise<object> => {
  const filePath = `${FileSystem.cacheDirectory}${fileName}}`;
  let content = await readFile(filePath);
  return JSON.parse(content);
};
