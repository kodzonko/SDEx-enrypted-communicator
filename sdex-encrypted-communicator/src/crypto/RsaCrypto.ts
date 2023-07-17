import { RSA } from "react-native-rsa-native";
import logger from "../Logger";
import { saveFileToDocumentsDirectory } from "../storage/FileOps";
import { KeyPair } from "../Types";

/**
 * Generate a new RSA key pair.
 * @param bits The number of bits to use in the key pair (default is 2048).
 * @returns The generated key pair.
 */
export const generateKeyPair = async (bits = 4096): Promise<KeyPair> =>
  RSA.generateKeys(bits).then((keyPair) => ({
    publicKey: keyPair.public,
    privateKey: keyPair.private,
  }));

/**
 * Export the RSA key pair to files in the documents directory.
 * File names will be id_rsa for private key and id_rsa.pub for public key.
 * @param keyPair The key pair to export.
 * @returns true if operation has been successful, false otherwise.
 */
export const exportKeyPair = async (keyPair: KeyPair): Promise<boolean> => {
  logger.info("Exporting key pair to files in the documents directory.");
  const publicExportSuccessful = await saveFileToDocumentsDirectory(
    "id_rsa.pub",
    keyPair.publicKey,
  );
  const privateExportSuccessful = await saveFileToDocumentsDirectory("id_rsa", keyPair.privateKey);
  if (!publicExportSuccessful || !privateExportSuccessful) {
    logger.error("Failed to export key pair to files.");
    return false;
  }
  logger.info("Key pair export successful. Files created in the documents directory.");
  return true;
};
