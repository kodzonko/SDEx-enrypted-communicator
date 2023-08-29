import { RSA } from "react-native-rsa-native";
import { DecryptionError, RsaGenerationError } from "../Errors";
import logger from "../Logger";
import { saveFileToUsersDocumentsDirectory } from "../storage/FileOps";
import { mmkvStorage } from "../storage/MmkvStorageMiddlewares";
import { KeyPair } from "../Types";
/**
 * Generate a new RSA key pair.
 * @param bits The number of bits to use in the key pair (default is 2048).
 * @returns The generated key pair.
 */
export async function generateKeyPair(bits = 2048): Promise<KeyPair> {
  logger.info("Generating RSA key pair.");
  return RSA.generateKeys(bits)
    .then((keyPair) => ({
      publicKey: keyPair.public,
      privateKey: keyPair.private,
    }))
    .catch((error) => {
      logger.error(error);
      throw new RsaGenerationError("Failed to generate RSA key pair.");
    });
}

/**
 * Export the RSA key pair to files in the documents directory.
 * File names will be id_rsa for private key and id_rsa.pub for public key.
 * @param keyPair The key pair to export.
 * @returns true if operation has been successful, false otherwise.
 */
export async function exportKeyPair(keyPair: KeyPair): Promise<void> {
  logger.info("Exporting key pair to files in a chosen directory.");
  await saveFileToUsersDocumentsDirectory("id_rsa.pub", keyPair.publicKey);
  await saveFileToUsersDocumentsDirectory("id_rsa", keyPair.privateKey);
}

export async function encryptRsa(publicKey: string, text: string): Promise<string> {
  logger.info("Encrypting message with RSA public key.");
  return RSA.encrypt(text, publicKey);
}
export async function decryptRsa(text: string): Promise<string> {
  logger.info("Decrypting message with RSA private key.");
  const privateKey = mmkvStorage.getString("privateKey");
  if (!privateKey) {
    throw new DecryptionError("Private key is not set, cannot decrypt.");
  }
  return RSA.decrypt(text, privateKey);
}
