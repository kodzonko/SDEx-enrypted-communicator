import { RSA } from "react-native-rsa-native";
import {
    RsaDecryptionError,
    RsaEncryptionError,
    RsaGenerationError,
    RsaSigningError,
} from "../Errors";
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
        const encrypted = await RSA.encrypt(text, publicKey);
        logger.debug(`(RSA) Encrypted text: ${encrypted}`);
        return encrypted;
    } catch (error: any) {
        logger.error(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            `Error when encrypting text with RSA public key: ${JSON.stringify(error.message)}`,
        );
        throw new RsaEncryptionError(`Failed to encrypt text with RSA public key.`);
    }
}
export async function decryptRsa(privateKey: string, text: string): Promise<string> {
    logger.info("Decrypting text with RSA private key.");
    try {
        const decrypted = await RSA.decrypt(text, privateKey);
        logger.debug(`(RSA) Decrypted text: ${text}`);
        return decrypted;
    } catch (error: any) {
        logger.error(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            `Error when decrypting text with RSA private key: ${JSON.stringify(error.message)}`,
        );
        throw new RsaDecryptionError("Failed to decrypt text with RSA private key.");
    }
}

export async function signRsa(privateKey: string, text: string): Promise<string> {
    logger.info("Signing text with RSA private key.");
    try {
        const signature = await RSA.sign(text, privateKey);
        logger.debug(`(RSA) signature: ${signature}`);
        return signature;
    } catch (e: any) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        logger.error(`Error when signing text with RSA private key: ${JSON.stringify(e.message)}`);
        throw new RsaSigningError("Failed to sign text with RSA private key.");
    }
}
