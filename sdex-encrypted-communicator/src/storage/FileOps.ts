import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Platform } from "react-native";
import RNFS from "react-native-fs";
import logger from "../Logger";

export const readFile = async (path: string): Promise<string | undefined> => {
  logger.info("Reading content from a file.");
  if (Platform.OS === "web") {
    logger.info("expo-file-system is not supported on web, returning.");
    return undefined;
  }
  return FileSystem.readAsStringAsync(path);
};

export const saveFileToUsersDocumentsDirectory = (fileName: string, value: string): void => {
  logger.info("Writing content to a file.");
  if (Platform.OS === "web") {
    logger.info("expo-file-system is not supported on web, returning.");
    return;
  }
  const path = `${RNFS.ExternalStorageDirectoryPath}/Documents/${fileName}`;
  RNFS.writeFile(path, value, "utf8")
    .then((success) => {
      logger.info(`Wrote content to file at uri=${path}`);
    })
    .catch((error) => {
      logger.error(`Error writing content to file: ${error}`);
    });
};

export const saveFile = async (fileName: string, value: string): Promise<boolean> => {
  logger.info("Writing content to a file.");
  if (Platform.OS === "web") {
    logger.info("expo-file-system is not supported on web, returning.");
    return false;
  }
  if (!FileSystem.documentDirectory) {
    logger.info("FileSystem.documentDirectory cannot be determined.");
    return false;
  }

  const path = `${FileSystem.documentDirectory}${fileName}`;
  logger.debug(`Writing content to path=${path}`);
  return FileSystem.writeAsStringAsync(path, value)
    .then(() => true)
    .catch(() => false);
};

export const saveImage = async (fileName: string, base64String: string): Promise<boolean> => {
  logger.info("Saving image to the device storage.");
  let successFlag = false;
  if (!FileSystem.documentDirectory) {
    return false;
  }
  const fileUri = FileSystem.documentDirectory + fileName;
  successFlag = await FileSystem.writeAsStringAsync(fileUri, base64String, {
    encoding: FileSystem.EncodingType.Base64,
  })
    .then(() => {
      logger.info("Image saved successfully.");
      return true;
    })
    .catch((error) => {
      if (error instanceof Error) {
        logger.error(`Failed to save image. Error=${error.message}`);
      }
      return false;
    });

  try {
    logger.info("Saving image to the device gallery.");
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === "granted") {
      await MediaLibrary.saveToLibraryAsync(fileUri)
        .then(() => {
          logger.info("Image saved to the gallery.");
        })
        .catch((error) => {
          if (error instanceof Error) {
            logger.error(`Failed to save image to the gallery. Error=${error.message}`);
          }
        });
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error saving image in the gallery. Error=${error.message}.`);
    }
  }
  return successFlag;
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
  return saveFile(filePath, JSON.stringify(content))
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
  return saveFile(filePath, JSON.stringify(content))
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

/**
 *Selects a file from the device storage.
 * @param mimeType The mime type of the file to select.
 * @returns Returns the path to the file or undefined if the user cancels the file selection.
 */
export const selectFile = async (mimeType: string): Promise<string | undefined> => {
  logger.info(`Selecting a file. Mime type=${mimeType}`);
  const documentResult = await DocumentPicker.getDocumentAsync({
    type: mimeType,
    copyToCacheDirectory: true,
  });
  const uri = documentResult.type === "success" ? documentResult.uri : undefined;
  logger.debug(`Selected file uri=${JSON.stringify(uri)}`);
  return uri;
};
