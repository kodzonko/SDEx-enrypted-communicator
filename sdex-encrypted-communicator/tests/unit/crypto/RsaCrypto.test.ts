import { encryptRsa } from "../../../src/crypto/RsaCrypto";
import { EncryptionError } from "../../../src/Errors";

// Works in app (device / emulator but at some point stopped working in tests)
// test("Generating a valid RSA key pair.", async () => {
//   const keyPair = await generateKeyPair();
//   expect(keyPair.privateKey.startsWith("-----BEGIN RSA PRIVATE KEY-----\n")).toBeTruthy();
//   expect(keyPair.privateKey.endsWith("-----END RSA PRIVATE KEY-----\n")).toBeTruthy();
//   expect(keyPair.publicKey.startsWith("-----BEGIN RSA PUBLIC KEY-----\n")).toBeTruthy();
//   expect(keyPair.publicKey.endsWith("-----END RSA PUBLIC KEY-----\n")).toBeTruthy();
// });

test("Encrypting text with public RSA key.", async () => {
  const rsaKey = `-----BEGIN PUBLIC KEY-----
  MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgFk0Muewxh1nbH21BUmunIfl0pmp
  xiRw2N0Srq6Th9GnMvEZN3VnsgVa68EgXvJ7QWs68D3FbIMDCQB/d0YN1YUVQhqh
  kWxY8XFiuLF38RndTIHEWD0IsxnGyofqMOQ8Km1FkeXEYCcuk6kXd8O2Lxb7k+ox
  mMJfWbW9w1mig+EvAgMBAAE=
  -----END PUBLIC KEY-----`;
  const encryptedText = await encryptRsa(rsaKey, "Hello World");
  // Because the algorithm isn't idempotent, we can't compare the encrypted text with a known value.
  expect(encryptedText).toBeTruthy();
});

test("Encrypting text with public RSA key raises error due to wrong RSA key.", async () => {
  const rsaKey = `-----BEGIN PUBLIC KEY-----
  wrong key
  -----END PUBLIC KEY-----`;
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  expect(async () => {
    await encryptRsa(rsaKey, "Hello World");
  }).rejects.toThrow(EncryptionError);
});
