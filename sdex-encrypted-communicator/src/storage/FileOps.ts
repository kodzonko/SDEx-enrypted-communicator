import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import logger from "../Logger";

export const readFile = async (path: string): Promise<string | undefined> => {
    logger.info("Reading content from a file.");
    if (Platform.OS === "web") {
        logger.info("expo-file-system is not supported on web, returning.");
        return undefined;
    }
    logger.debug(`Reading file from path=${path}`);
    return FileSystem.readAsStringAsync(path);
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
    content: string,
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
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    logger.debug(`Creating a file at path=${filePath}`);
    return FileSystem.writeAsStringAsync(filePath, content)
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

/**
 *Selects a file from the device storage.
 * @param mimeType The mime type of the file to select.
 * @returns Returns the path to the file or undefined if the user cancels the file selection.
 */
export const selectFile = async (mimeType?: string): Promise<string | undefined> => {
    logger.info(`Selecting a file. Mime type=${JSON.stringify(mimeType)}`);
    const documentResult = await DocumentPicker.getDocumentAsync({
        type: mimeType,
        multiple: false,
    });
    const uri = documentResult.type === "success" ? documentResult.uri : undefined;
    logger.debug(`Selected file uri=${JSON.stringify(uri)}`);
    return uri;
};

export async function shareFile(uri: string): Promise<boolean> {
    logger.info(`Sharing file to uri=${uri}`);
    try {
        return Sharing.shareAsync(uri)
            .then(() => true)
            .catch(() => false);
    } catch (error: any) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        logger.error(`Error when sharing file. Error=${JSON.stringify(error.message)}`);
        return false;
    }
}
