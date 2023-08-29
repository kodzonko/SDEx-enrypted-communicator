import { blake3 } from "@noble/hashes/blake3";
import { EncryptionError } from "../Errors";
import logger from "../Logger";
import {
  bytesToString,
  changeTo1IndexedArray,
  mergeUint8Arrays,
  splitMessageIntoBlocks,
  stringToBytes,
} from "../utils/Converters";
import { xorUintArrays } from "../utils/Math";

export default class SdexCrypto {
  #HASH_LENGTH: number;

  #ZEROED_BLOCK: Uint8Array;

  initializationHash: Uint8Array;

  hashFromUserPassword: Uint8Array;

  sessionKey: Uint8Array;

  constructor(
    initializationHash: Uint8Array,
    hashFromUserPassword: Uint8Array,
    sessionKey: Uint8Array,
    hashLength = 32,
  ) {
    this.initializationHash = initializationHash;
    this.hashFromUserPassword = hashFromUserPassword;
    this.#HASH_LENGTH = hashLength;
    this.#ZEROED_BLOCK = new Uint8Array(this.#HASH_LENGTH);
    this.sessionKey = sessionKey;
  }

  #blake3Wrapper(message: Uint8Array | string, context?: Uint8Array | string) {
    return blake3(message, {
      dkLen: this.#HASH_LENGTH,
      context,
    });
  }

  /**
   * Encrypts a single block of message.
   * @param block A block of plain text message to encrypt.
   * @param hash1 First hash block needed for encryption.
   * @param hash2 Second hash block needed for encryption.
   */
  private static calculateBlock(
    block: Uint8Array,
    hash1: Uint8Array,
    hash2: Uint8Array,
  ): Uint8Array {
    if (block.length !== hash1.length || block.length !== hash2.length) {
      logger.error(`block length=${block.length}, block=${block.toString()}`);
      logger.error(`hash1 length=${hash1.length}, hash1=${hash1.toString()}`);
      logger.error(`hash2 length=${hash2.length}, hash2=${hash2.toString()}`);
      throw new EncryptionError("Invalid block length");
    }
    return xorUintArrays(block, hash1, hash2);
  }

  private calculateMessage(messageByteArray: Uint8Array): Uint8Array {
    // Message split into blocks with length equal to hashes to facilitate XOR operations
    const messageSplit = splitMessageIntoBlocks(messageByteArray, this.#HASH_LENGTH);
    // Array changed to 1-based indexing to follow SDEx algorithm more easily
    const messageBlocks = changeTo1IndexedArray(messageSplit);
    const result = <Uint8Array[]>[];
    const hashIterations = <Uint8Array[]>[]; // h0, h1, ..., hk
    hashIterations[0] = this.initializationHash; // h0
    const sessionKeyHash = this.#blake3Wrapper(this.sessionKey); // aka hash from initialization vector H(IV)
    // First block
    logger.debug("Calculating k=1 block.");
    // IV++h0
    const sessionKeyAndInitializationHash = mergeUint8Arrays(
      this.sessionKey,
      this.initializationHash,
    );
    // H(IV++h0)
    const hashFromSessionKeyAndInitializationHash = this.#blake3Wrapper(
      sessionKeyAndInitializationHash,
    );
    // C1
    result[1] = SdexCrypto.calculateBlock(
      messageBlocks[1] as Uint8Array,
      sessionKeyHash,
      hashFromSessionKeyAndInitializationHash,
    );
    // h1
    hashIterations[1] = this.#blake3Wrapper(
      sessionKeyAndInitializationHash,
      mergeUint8Arrays(messageBlocks[1] as Uint8Array, messageBlocks[2] ?? this.#ZEROED_BLOCK),
    );

    // Second block
    logger.debug("Calculating k=2 block.");
    // C2
    if (messageBlocks[2]) {
      result[2] = SdexCrypto.calculateBlock(
        messageBlocks[2],
        this.hashFromUserPassword,
        sessionKeyHash,
      );
      // h2
      hashIterations[2] = this.#blake3Wrapper(
        xorUintArrays(
          hashIterations[0] ?? this.#ZEROED_BLOCK,
          hashFromSessionKeyAndInitializationHash,
        ),
        mergeUint8Arrays(
          messageBlocks[3] ?? this.#ZEROED_BLOCK,
          messageBlocks[4] ?? this.#ZEROED_BLOCK,
        ),
      );
    }
    // Subsequent blocks
    for (let k = 1; k <= messageBlocks.length; k += 1) {
      // k-th hash iteration
      if (k >= 3) {
        logger.debug(`Calculating hash iteration k=${k}.`);
        hashIterations[k] = this.#blake3Wrapper(
          xorUintArrays(
            hashIterations[k - 1] ?? this.#ZEROED_BLOCK,
            hashIterations[k - 2] ?? this.#ZEROED_BLOCK,
          ),
          mergeUint8Arrays(
            messageBlocks[2 * k - 1] ?? this.#ZEROED_BLOCK,
            messageBlocks[2 * k] ?? this.#ZEROED_BLOCK,
          ),
        );
        logger.debug(`Calculating k=${k + 1} block.`);
        // Odd blocks in 1-based indexing (k=3, 5, 7...)
        result[2 * k + 1] = SdexCrypto.calculateBlock(
          messageBlocks[2 * k + 1] ?? this.#ZEROED_BLOCK,
          hashIterations[k] ?? this.#ZEROED_BLOCK,
          hashIterations[k - 1] ?? this.#ZEROED_BLOCK,
        );
        // Even blocks in 1-based indexing (k=4, 6, 8...)
        result[2 * k + 2] = SdexCrypto.calculateBlock(
          messageBlocks[2 * k] ?? this.#ZEROED_BLOCK,
          this.hashFromUserPassword,
          hashIterations[k] ?? this.#ZEROED_BLOCK,
        );
      }
    }
    // Remove empty element (at 0 index)
    const nonEmptyArray = result.filter((element) => element);
    // Trim empty superfluous bytes from the end of the last block

    return mergeUint8Arrays(...nonEmptyArray);
  }

  encryptMessage(message: string): Uint8Array {
    logger.info("Encrypting message.");
    const messageByteArray = stringToBytes(message);
    return this.calculateMessage(messageByteArray);
  }

  decryptMessage(messageCipherTextByteArray: Uint8Array): string {
    logger.info("Decrypting message.");
    const decryptedByteArray = this.calculateMessage(messageCipherTextByteArray);
    // Remove empty superfluous bytes from the end of the last block
    for (let i = decryptedByteArray.length - 1; i >= 0; i -= 1) {
      if (decryptedByteArray[i] !== 0) {
        return bytesToString(decryptedByteArray.slice(0, i + 1));
      }
    }
    // All bytes are empty
    return "";
  }
}
