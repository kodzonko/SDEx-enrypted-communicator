import * as Crypto from "expo-crypto";

/**
 * Generates a unique user's messaging key
 * Key length should be 128 bits minimum (hence the default 32 bytes == 256 bits.)
 * @param bits The number of bits to generate the key with.
 * @returns The generated messaging key.
 */
const generateMessagingKey = (bits = 256): Uint8Array =>
  Crypto.getRandomBytes(Math.round(bits / 8));

export default generateMessagingKey;
