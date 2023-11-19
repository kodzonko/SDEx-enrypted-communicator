import { generateSessionKeyPart } from "../../../src/crypto/CryptoHelpers";
import SdexCrypto from "../../../src/crypto/SdexCrypto";
import { SdexEncryptionError } from "../../../src/Errors";

const sessionKey = new Uint8Array([
    199, 182, 158, 16, 28, 191, 237, 76, 143, 157, 160, 176, 212, 216, 69, 149, 116, 80, 98, 155,
    212, 183, 228, 53, 100, 16, 112, 89, 150, 82, 0, 116, 163, 242, 21, 164, 67, 83, 188, 5, 92, 26,
    189, 251, 17, 55, 89, 90, 4, 193, 80, 49, 150, 142, 205, 68, 98, 31, 22, 221, 192, 211, 235, 55,
]);
const clearTextMessage = "Hello world!";
const encryptedMessage = new Uint8Array([
    216, 52, 125, 5, 37, 138, 143, 114, 25, 15, 52, 201, 212, 18, 223, 193, 158, 24, 12, 232, 141,
    40, 144, 183, 142, 15, 134, 10, 228, 223, 72, 148,
]);
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const sdexEngine = new SdexCrypto(sessionKey, 32);

test("Generating a session key part.", () => {
    const sessionKeyPart = generateSessionKeyPart(32);
    expect(sessionKeyPart.length).toBe(32);
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
    expect(result).toThrow(SdexEncryptionError);
    expect(result).toThrow("Invalid block length");
});

test("Encrypting a message properly.", () => {
    const result = sdexEngine.encryptMessage(clearTextMessage);
    expect(result).toEqual(encryptedMessage);
});

test("Decrypting a message properly.", () => {
    const result = sdexEngine.decryptMessage(encryptedMessage);
    expect(result).toBe(clearTextMessage);
});

test("SDEx encryption is reversible.", () => {
    const encrypted = sdexEngine.encryptMessage(clearTextMessage);
    const decrypted = sdexEngine.decryptMessage(encrypted);
    expect(clearTextMessage).toBe(decrypted);
});
