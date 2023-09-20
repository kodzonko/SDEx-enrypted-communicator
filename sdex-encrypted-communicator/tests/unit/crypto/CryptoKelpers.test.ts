import { splitSessionKey } from "../../../src/crypto/CryptoHelpers";

test("Splitting session key parts.", () => {
  const sessionKey = new Uint8Array([
    199, 182, 158, 16, 28, 191, 237, 76, 143, 157, 160, 176, 212, 216, 69, 149, 116, 80, 98, 155,
    212, 183, 228, 53, 100, 16, 112, 89, 150, 82, 0, 116, 163, 242, 21, 164, 67, 83, 188, 5, 92, 26,
    189, 251, 17, 55, 89, 90, 4, 193, 80, 49, 150, 142, 205, 68, 98, 31, 22, 221, 192, 211, 235, 55,
  ]);
  const firstSessionKeyPartExpected = new Uint8Array([
    199, 182, 158, 16, 28, 191, 237, 76, 143, 157, 160, 176, 212, 216, 69, 149, 116, 80, 98, 155,
    212, 183, 228, 53, 100, 16, 112, 89, 150, 82, 0, 116,
  ]);
  const secondSessionKeyPartExpected = new Uint8Array([
    163, 242, 21, 164, 67, 83, 188, 5, 92, 26, 189, 251, 17, 55, 89, 90, 4, 193, 80, 49, 150, 142,
    205, 68, 98, 31, 22, 221, 192, 211, 235, 55,
  ]);
  const [sessionKeyFirstPart, sessionKeySecondPart] = splitSessionKey(sessionKey);
  expect(sessionKeyFirstPart).toEqual(firstSessionKeyPartExpected);
  expect(sessionKeySecondPart).toEqual(secondSessionKeyPartExpected);
});
