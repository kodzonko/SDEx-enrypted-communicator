import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
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
  try {
    // Request device storage access permission
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === "granted") {
      // Save image to media library
      const asset = await MediaLibrary.createAssetAsync(downloadedFile.uri);
      await MediaLibrary.saveToLibraryAsync(uri);
    }
  } catch (error) {
    logger.error(error);
    throw new FileSystemError(GENERIC_LOCAL_STORAGE_FILESYSTEM_ERROR_MSG);
  }
};
