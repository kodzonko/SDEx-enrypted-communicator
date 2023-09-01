import { RSA } from "react-native-rsa-native";
import { RsaGenerationError } from "../Errors";
import logger from "../Logger";
import { saveFileToDocumentsDirectory } from "../storage/FileOps";
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
    .catch((error: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      logger.error(`Error when generating key pair: ${JSON.stringify(error.message)}`);
      throw new RsaGenerationError("Failed to generate RSA key pair.");
    });
}

/**
 * Export the RSA key pair to files in the documents directory.
 * File names will be id_rsa.txt for private key and id_rsa.pub.txt for public key.
 * @param keyPair The key pair to export.
 * @returns true if operation has been successful, false otherwise.
 */
export async function exportKeyPair(keyPair: KeyPair): Promise<void> {
  logger.info("Exporting key pair to files in a chosen directory.");
  await saveFileToDocumentsDirectory("id_rsa.pub.txt", keyPair.publicKey);
  await saveFileToDocumentsDirectory("id_rsa.txt", keyPair.privateKey);
}

export async function encryptRsa(publicKey: string, text: string): Promise<string> {
  logger.info("Encrypting text with RSA public key.");
  try {
    return await RSA.encrypt(text, publicKey);
  } catch (e: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    logger.error(`Error when encrypting message with RSA public key: ${JSON.stringify(e.message)}`);
    throw new Error(`Failed to encrypt message with RSA public key.`);
  }
}
export async function decryptRsa(privateKey: string, text: string): Promise<string> {
  logger.info("Decrypting message with RSA private key.");
  return RSA.decrypt(text, privateKey);
}

export async function doubleEncryptRsa(
  firstPartyPrivate: string,
  thirdPartyPublic: string,
  text: string,
): Promise<string> {
  const firstEncryption = await encryptRsa(firstPartyPrivate, text);
  const secondEncryption = await encryptRsa(thirdPartyPublic, firstEncryption);
  return secondEncryption;
}

export async function doubleDecryptRsa(
  firstPartyPrivate: string,
  thirdPartyPublic: string,
  text: string,
): Promise<string> {
  const firstDecryption = await decryptRsa(thirdPartyPublic, text);
  const secondDecryption = await decryptRsa(firstPartyPrivate, firstDecryption);
  return secondDecryption;
}
