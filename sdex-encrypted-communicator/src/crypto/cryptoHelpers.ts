import { blake3 } from "@noble/hashes/blake3";
import * as Crypto from "expo-crypto";
import { useCryptoContextStore } from "../contexts/CryptoContext";
import { mmkvStorage } from "../storage/MmkvStorageMiddlewares";
import { getSecure } from "../storage/SecureStoreMiddlewares";
import { PersonalSdexEngineContext } from "../Types";

export async function generateHashFromUserPassword(): Promise<Uint8Array> {
  const userPin = await getSecure("userPIN");
  if (typeof userPin !== "string") {
    throw new Error("User PIN is not set or is not a string.");
  }
  return blake3(userPin, {
    dkLen: 32,
  });
}

export function generateInitializationHash(): Uint8Array {
  const randomSeed = Crypto.getRandomBytes(128);
  return blake3(randomSeed, {
    dkLen: 32,
  });
}

/**
 * Generates a unique session key for the SDEx encryption process.
 * The session key is exchanged between both clients participating in the communication process.
 * Key length should be 128 bits minimum (hence the default 32 bytes == 256 bits.)
 * @returns The generated session key.
 */
export function generateSessionKey(byteCount = 32): Uint8Array {
  return Crypto.getRandomBytes(byteCount);
}

/**
 * Decide whether to use your own crypto context or the one of the other party.
 */
export function chooseSdexCryptoContext(
  publicKeyFrom: string,
  publicKeyTo: string,
): {
  initializationHash: Uint8Array;
  hashFromUserPassword: Uint8Array;
  sessionKey: Uint8Array;
} {
  const myPublicKey = mmkvStorage.getString("publicKey");
  const context: PersonalSdexEngineContext & { sessionKey: Uint8Array } = {};
  if (publicKeyFrom === myPublicKey) {
    // You are the sender. Taking your own crypto context.
    const myInitializationHash =
      useCryptoContextStore.getState().myCryptoContext?.initializationHash;
    const myHashFromUserPassword =
      useCryptoContextStore.getState().myCryptoContext?.hashFromUserPassword;
    if (!myInitializationHash || !myHashFromUserPassword) {
      throw new Error("My crypto context is not set.");
    }
    context.hashFromUserPassword = myInitializationHash;
    context.initializationHash = myHashFromUserPassword;
  } else {
    // Third party is the sender. Taking their crypto context.
    const thirdPartyContext = useCryptoContextStore
      .getState()
      .othersCryptoContexts.get(publicKeyFrom);
    if (!thirdPartyContext) {
      throw new Error("Third party's crypto context is not set.");
    }
    context.hashFromUserPassword = thirdPartyContext.initializationHash;
    context.initializationHash = thirdPartyContext.hashFromUserPassword;
    context.sessionKey = thirdPartyContext.sessionKey;
  }
  // Deciding session key - if exists take the one from third party context stored in state, otherwise generate a new one.
  if (!context.sessionKey) {
    const newSessionKey = generateSessionKey();
    context.sessionKey = newSessionKey;
    useCryptoContextStore.getState().addOthersCryptoContext(
      // Key must be the other party's key, not yours.
      publicKeyFrom !== myPublicKey ? publicKeyFrom : publicKeyTo,
      newSessionKey,
    );
  }
  return context;
}
