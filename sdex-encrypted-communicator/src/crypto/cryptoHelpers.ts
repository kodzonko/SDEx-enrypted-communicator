import { blake3 } from "@noble/hashes/blake3";
import * as Crypto from "expo-crypto";
import { PreconditionError } from "../Errors";
import { mmkvStorage } from "../storage/MmkvStorageMiddlewares";
import { getSecure } from "../storage/SecureStoreMiddlewares";
import { FirstPartySdexEngineContext, ThirdPartySdexEngineContext } from "../Types";

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
  firstPartyCryptoContext: FirstPartySdexEngineContext,
  thirdPartyContext: ThirdPartySdexEngineContext,
): {
  initializationHash: Uint8Array;
  hashFromUserPassword: Uint8Array;
  sessionKey: Uint8Array;
} {
  const context: {
    initializationHash: Uint8Array;
    hashFromUserPassword: Uint8Array;
    sessionKey: Uint8Array;
  } = {
    initializationHash: new Uint8Array(),
    hashFromUserPassword: new Uint8Array(),
    sessionKey: new Uint8Array(),
  };
  const firstPartyPublicKey = mmkvStorage.getString("publicKey");
  if (publicKeyFrom === firstPartyPublicKey) {
    // You are the sender. Taking your own crypto context.
    if (
      !firstPartyCryptoContext.initializationHash ||
      !firstPartyCryptoContext.hashFromUserPassword
    ) {
      throw new PreconditionError(
        "First party crypto context is not set. SDEx encryption won't be possible.",
      );
    }
    context.initializationHash = firstPartyCryptoContext.initializationHash;
    context.hashFromUserPassword = firstPartyCryptoContext.hashFromUserPassword;
  } else {
    // Third party is the sender. Taking their crypto context.
    if (!thirdPartyContext.initializationHash || !thirdPartyContext.hashFromUserPassword) {
      throw new PreconditionError(
        "Third party's crypto context is not set. SDEx Decryption of received message won't be possible.",
      );
    }
    context.hashFromUserPassword = thirdPartyContext.initializationHash;
    context.initializationHash = thirdPartyContext.hashFromUserPassword;
  }
  // If session key wasn't set yet, it's an error. Either side should have set it with chatInit request.
  if (!thirdPartyContext.sessionKey) {
    throw new PreconditionError(
      "Session key is not set. Either side should have set it before calling chooseSdexCryptoContext.",
    );
  } else {
    context.sessionKey = thirdPartyContext.sessionKey;
  }
  return context;
}
