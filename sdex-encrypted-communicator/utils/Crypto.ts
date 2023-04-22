import { blake3 } from "@noble/hashes/blake3";
import { EncryptionError } from "../Errors";
import { XORByteArrays } from "./Math";

const HASH_LENGTH = 32;

export const encrypt = (
  msg: string,
  userPrivateKey: string, // U a.k.a. user password
  sessionKey: string, // IV a.k.a. Initialization Vector
  initializationHash: string, // h0
): string => {
  const msgBytes = strToBytes(msg);
  const msgBlocks = splitIntoBlocks(msgBytes, HASH_LENGTH); // M_1, M_2, ..., M_n
  const sessionKeyHash = blake3(sessionKey, { dkLen: HASH_LENGTH }); //H_IV
  const userPrivateKeyHash = blake3(userPrivateKey, { dkLen: HASH_LENGTH }); // H_U
  const seed = blake3(sessionKey + initializationHash, { dkLen: HASH_LENGTH }); // h_{IV+h0}

  const encryptBlock = (
    plainBlock: Uint8Array,
    hash1: Uint8Array,
    hash2: Uint8Array,
  ): Uint8Array => {
    if (plainBlock.length !== hash1.length || plainBlock.length !== hash2.length) {
      throw new EncryptionError("Invalid block length");
    }
    const result = XORByteArrays(plainBlock, hash1, hash2);
    return result;
  };

  if (msgBlocks.length < 1) {
    throw new EncryptionError("Message is empty.");
  }
  // Ensure even number of msg blocks
  if (msgBlocks.length % 2 !== 0) {
    msgBlocks.push(new Uint8Array(HASH_LENGTH));
  }

  const c1 = encryptBlock(msgBlocks[0], sessionKeyHash, seed);
  const c2 = encryptBlock(msgBlocks[1], userPrivateKeyHash, sessionKeyHash);
  const h1 = blake3(seed, {
    dkLen: HASH_LENGTH,
    context: msgBlocksToContext(msgBlocks[0], msgBlocks[1]),
  });
  const h1XORedWithSeed = bytesToStr(XORByteArrays(h1, seed));
  const h2 =
    msgBlocks.length >= 4
      ? blake3(h1XORedWithSeed, {
          dkLen: HASH_LENGTH,
          context: msgBlocksToContext(msgBlocks[2], msgBlocks[3]),
        })
      : null;
  const encryptedMsgBlocks = new Array<Uint8Array>(c1, c2);
  const hashIterations = new Array<Uint8Array>();
  hashIterations.push(h1);
  if (h2) {
    hashIterations.push(h2);
  }
  if (msgBlocks.length > 4) {
    for (let i = 2; i < msgBlocks.length / 2; i += 2) {
      const hashKIteration = calculateKHashIteration(
        hashIterations[i - 1],
        hashIterations[i - 2],
        msgBlocks[i * 2 - 1],
        msgBlocks[i * 2],
      );
      hashIterations.push(hashKIteration);
      if (i % 2 === 0) {
        encryptedMsgBlocks.push(
          encryptBlock(msgBlocks[i], userPrivateKeyHash, hashKIteration),
        );
      } else {
        encryptBlock(msgBlocks[i], hashKIteration, hashIterations[i - 1]);
      }
    }
  }
  let result = "";
  encryptedMsgBlocks.forEach((block) => {
    result += bytesToStr(block);
  });

  return result;
};

const decrypt = (
  encodedMsg: string,
  userPrivateKey: string, //  U a.k.a. password
  sessionKey: string, // IV a.k.a. Initialization Vector
  initializationHash: string, // h0
): string => {
  const decryptBlock = (
    cipherBlock: Uint8Array,
    hash1: Uint8Array,
    hash2: Uint8Array,
  ) => {
    return XORByteArrays(cipherBlock, hash1, hash2);
  };

  const cipherMsgBytes = strToBytes(encodedMsg);
  const cipherMsgBlocks = splitIntoBlocks(cipherMsgBytes, HASH_LENGTH); // c_1, c_2, ..., c_n
  const sessionKeyHash = blake3(sessionKey, { dkLen: HASH_LENGTH }); //H_IV
  const userPrivateKeyHash = blake3(userPrivateKey, { dkLen: HASH_LENGTH });
  const seed = blake3(sessionKey + initializationHash, { dkLen: HASH_LENGTH }); // h_{IV+h0}

  if (cipherMsgBlocks.length < 1) {
    throw new EncryptionError("Message is empty.");
  }

  // TODO: skąd wziąć M_1...M_n potrzebne do obliczenia h_1...h_n?
  const h1 = blake3(seed, {
    dkLen: HASH_LENGTH,
    context: msgBlocksToContext("M1", "M2"),
  });
  const h1XORedWithSeed = bytesToStr(XORByteArrays(h1, seed));
  const h2 = blake3(h1XORedWithSeed, {
    dkLen: HASH_LENGTH,
    context: msgBlocksToContext("M3", "M4"),
  });
  const hashIterations = new Array<Uint8Array>(h1, h2);

  const m1 = decryptBlock(cipherMsgBlocks[0], sessionKeyHash, seed);

  // if (msgBlocks.length > 4)
  for (let i = 2; i < cipherMsgBlocks.length; i += 2) {
    const hashKIteration = calculateKHashIteration(
      hashIterations[i - 1],
      hashIterations[i - 2],
      "M_{2k-1}",
      "M_{2k}",
    );
    hashIterations.push(hashKIteration);
  }
};

const generateSessionKey = (
  senderPrivateKey: string,
  recipientPrivateKey: string,
): string => {
  if (senderPrivateKey.length !== recipientPrivateKey.length) {
    throw new EncryptionError("Klucze prywatne muszą być tej samej długości");
  }
  const senderPrivateKeyBytes = strToBytes(senderPrivateKey);
  const recipientPrivateKeyBytes = strToBytes(recipientPrivateKey);
  const result = new Uint8Array(senderPrivateKeyBytes.length);
  for (let i = 0; i < senderPrivateKeyBytes.length; i++) {
    result[i] = senderPrivateKeyBytes[i] ^ recipientPrivateKeyBytes[i];
  }

  return bytesToStr(result);
};

const strToBytes = (str: string): Uint8Array => {
  const utf8Encode = new TextEncoder();
  return utf8Encode.encode(str);
};

const bytesToStr = (bytes: Uint8Array): string => {
  const utf8Decode = new TextDecoder();
  return utf8Decode.decode(bytes);
};

const msgBlocksToContext = (block1: Uint8Array, block2: Uint8Array): string => {
  const blockString1 = bytesToStr(block1);
  const blockString2 = bytesToStr(block2);
  return blockString1 + blockString2;
};

const splitIntoBlocks = (byteArray: Uint8Array, blockSize: number): Uint8Array[] => {
  const result = new Array<Uint8Array>();
  for (let i = 0; i < byteArray.length; i += blockSize) {
    result.push(byteArray.slice(i, i + blockSize));
  }
  return result;
};

// h_k
const calculateKHashIteration = (
  kMinus1Hash: Uint8Array, // h_{k-1}
  kMinus2Hash: Uint8Array, // h_{k-2}
  twoKMinus1MsgBlock: Uint8Array, // M_{2k-1}
  twoKMsgBlock: Uint8Array, // M_{2k}
): Uint8Array => {
  const XORedHashes = XORByteArrays(kMinus1Hash, kMinus2Hash);
  return blake3(bytesToStr(XORedHashes), {
    dkLen: HASH_LENGTH,
    context: msgBlocksToContext(twoKMinus1MsgBlock, twoKMsgBlock),
  });
};
