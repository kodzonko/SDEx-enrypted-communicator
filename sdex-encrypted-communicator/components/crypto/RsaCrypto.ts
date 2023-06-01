import * as FileSystem from "expo-file-system";
import keypair from "keypair";


/**
 * Generate a new RSA key pair.
 * @param bits The number of bits to use in the key pair (default is 2048).
 */
export const generateKeyPair = (bits: number = 2048): KeyPair => {
  const keyPair = keypair({ bits });

  return {
    publicKey: keyPair.public,
    privateKey: keyPair.private,
  };
};

/**
 * Export the key pair to files saved in the Documents directory.
 * @param keyPair The key pair to export.
 */
export const exportKeyPair = (keyPair: KeyPair): void => {
  const privateKeyPath = `${FileSystem.documentDirectory}id_rsa`;
  const publicKeyPath = `${FileSystem.documentDirectory}id_rsa.pub`;
  logger.info("Creating files with keys in the Documents directory.");
  FileSystem.writeAsStringAsync(publicKeyPath, keyPair.publicKey).catch((error) => {
    logger.error(GENERIC_LOCAL_STORAGE_FILESYSTEM_ERROR_MSG, error);
    throw new FileSystemError(GENERIC_LOCAL_STORAGE_FILESYSTEM_ERROR_MSG + error);
  });
  FileSystem.writeAsStringAsync(privateKeyPath, keyPair.privateKey).catch((error) => {
    logger.error(GENERIC_LOCAL_STORAGE_FILESYSTEM_ERROR_MSG + error);
    throw new FileSystemError(GENERIC_LOCAL_STORAGE_FILESYSTEM_ERROR_MSG + error);
  });
  logger.info("Files with keys have been created.");
};
