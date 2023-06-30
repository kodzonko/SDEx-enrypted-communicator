import { blake3 } from "@noble/hashes/blake3";
import SdexCrypto from "../../../src/crypto/SdexCrypto";
import { EncryptionError } from "../../../src/Errors";

const initializationHash = blake3("test-initialization-hash", { dkLen: 32 });
const hashFromUserPassword = blake3("test-user-password-hash", { dkLen: 32 });
const sessionKey = new Uint8Array([
  199, 182, 158, 16, 28, 191, 237, 76, 143, 157, 160, 176, 212, 216, 69, 149, 116, 80, 98, 155, 212,
  183, 228, 53, 100, 16, 112, 89, 150, 82, 0, 116,
]);
const messageEncryptorDecryptor = new SdexCrypto(
  initializationHash,
  hashFromUserPassword,
  sessionKey,
  32,
);

test("Generating a session key.", () => {
  const newSessionKey = SdexCrypto.generateSessionKey(32);
  expect(newSessionKey.length).toBe(32);
});

test("Calculating a block properly.", () => {
  const array1 = new Uint8Array([121, 133]); //   01111001 10000101
  const array2 = new Uint8Array([38, 6]); //      00100110 00000110
  const array3 = new Uint8Array([130, 69]); //    10000010 01000101
  const result = SdexCrypto.calculateBlock(array1, array2, array3);
  const expected = new Uint8Array([221, 198]); // 11011101 11000110
  expect(result).toEqual(expected);
});

test("Calculating a block throws error on mismatching arrays lengths.", () => {
  const array1 = new Uint8Array([121, 133]);
  const array2 = new Uint8Array([9]);
  const array3 = new Uint8Array([130, 69]);
  const result = () => {
    SdexCrypto.calculateBlock(array1, array2, array3);
  };
  expect(result).toThrow(EncryptionError);
  expect(result).toThrow("Invalid block length");
});

test("Encrypting a message properly.", () => {
  const result = messageEncryptorDecryptor.encryptMessage("Hello world!");
  const expected = new Uint8Array([
    33, 219, 133, 253, 234, 100, 96, 76, 182, 215, 34, 78, 50, 106, 19, 179, 173, 229, 8, 238, 29,
    117, 182, 204, 171, 238, 138, 5, 127, 84, 88, 172,
  ]);
  expect(result).toEqual(expected);
});

test("Decrypting a message properly.", () => {
  const message = new Uint8Array([
    33, 219, 133, 253, 234, 100, 96, 76, 182, 215, 34, 78, 50, 106, 19, 179, 173, 229, 8, 238, 29,
    117, 182, 204, 171, 238, 138, 5, 127, 84, 88, 172,
  ]);
  const result = messageEncryptorDecryptor.decryptMessage(message);
  const expected = "Hello world!";
  expect(result).toBe(expected);
});
