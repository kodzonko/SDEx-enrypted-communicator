import * as Crypto from "expo-crypto";

/**
 * Generates a random session key part for the SDEx encryption process.
 * The session key parts are exchanged and joined between both clients participating in the communication process.
 * Key length should be 128 bits minimum (hence the default 16 bytes == 128 bits.), the whole key is twice as long.
 * @returns The generated session key part.
 */
export function generateSessionKeyPart(byteCount = 16): Uint8Array {
    return Crypto.getRandomBytes(byteCount);
}

/**
 * Splits a session key into two parts.
 */
export function splitSessionKey(sessionKey: Uint8Array): Uint8Array[] {
    const halfLength = sessionKey.length / 2;
    return [sessionKey.slice(0, halfLength), sessionKey.slice(halfLength)];
}
