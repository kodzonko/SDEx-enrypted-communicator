import { blake3 } from "@noble/hashes/blake3";
import SdexCrypto from "../../../src/crypto/SdexCrypto";
import { EncryptionError } from "../../../src/Errors";
import { stringToBytes } from "../../../src/utils/Converters";

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
  const array2 = new Uint8Array([38]);
  const array3 = new Uint8Array([130, 69]);
  const result = () => {
    SdexCrypto.calculateBlock(array1, array2, array3);
  };
  expect(result).toThrow(EncryptionError);
  expect(result).toThrow("Invalid block length");
});

test("Encrypting a message properly.", () => {
  const message = stringToBytes("Hello world!");
  const result = messageEncryptorDecryptor.encryptMessage(message);
  const expected = new Uint8Array([
    33, 219, 133, 253, 234, 100, 96, 76, 182, 215, 34, 78, 50, 106, 19, 179, 173, 229, 8, 238, 29,
    117, 182, 204, 171, 238, 138, 5, 127, 84, 88, 172, 81, 109, 231, 222, 197, 40, 214, 110, 117,
    47, 118, 146, 243, 107, 43, 68, 19, 23, 193, 111, 9, 24, 68, 43, 207, 154, 28, 107, 83, 61, 20,
    255, 199, 135, 191, 125, 72, 41, 225, 66, 41, 95, 231, 208, 230, 239, 43, 54, 181, 9, 50, 29,
    157, 103, 234, 129, 28, 7, 23, 233, 232, 51, 167, 74, 31, 144, 175, 139, 42, 213, 207, 83, 159,
    143, 127, 241, 112, 53, 66, 228, 91, 21, 9, 242, 237, 170, 221, 22, 171, 34, 239, 241, 218, 114,
    244, 240, 97, 248, 228, 32, 37, 102, 177, 165, 137, 162, 103, 98, 136, 215, 183, 236, 251, 31,
    253, 20, 45, 208, 103, 30, 200, 250, 91, 197, 250, 97, 52, 108, 126, 104, 75, 171, 15, 179, 126,
    246, 22, 45, 24, 147, 248, 226, 245, 8, 160, 10, 244, 230, 192, 122, 186, 8, 99, 216, 180, 52,
    32, 19, 192, 156,
  ]);
  expect(result).toEqual(expected);
});

test("Decrypting a message properly.", () => {
  const message = new Uint8Array([
    33, 219, 133, 253, 234, 100, 96, 76, 182, 215, 34, 78, 50, 106, 19, 179, 173, 229, 8, 238, 29,
    117, 182, 204, 171, 238, 138, 5, 127, 84, 88, 172, 81, 109, 231, 222, 197, 40, 214, 110, 117,
    47, 118, 146, 243, 107, 43, 68, 19, 23, 193, 111, 9, 24, 68, 43, 207, 154, 28, 107, 83, 61, 20,
    255, 199, 135, 191, 125, 72, 41, 225, 66, 41, 95, 231, 208, 230, 239, 43, 54, 181, 9, 50, 29,
    157, 103, 234, 129, 28, 7, 23, 233, 232, 51, 167, 74, 31, 144, 175, 139, 42, 213, 207, 83, 159,
    143, 127, 241, 112, 53, 66, 228, 91, 21, 9, 242, 237, 170, 221, 22, 171, 34, 239, 241, 218, 114,
    244, 240, 97, 248, 228, 32, 37, 102, 177, 165, 137, 162, 103, 98, 136, 215, 183, 236, 251, 31,
    253, 20, 45, 208, 103, 30, 200, 250, 91, 197, 250, 97, 52, 108, 126, 104, 75, 171, 15, 179, 126,
    246, 22, 45, 24, 147, 248, 226, 245, 8, 160, 10, 244, 230, 192, 122, 186, 8, 99, 216, 180, 52,
    32, 19, 192, 156,
  ]);
  const result = messageEncryptorDecryptor.decryptMessage(message);
  const expected = "Hello world!";
  expect(result).toEqual(expected);
});
