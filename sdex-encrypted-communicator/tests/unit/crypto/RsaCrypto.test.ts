import { generateKeyPair } from "../../../src/crypto/RsaCrypto";

test("Generating a valid RSA key pair.", () => {
  const keyPair = generateKeyPair();
  expect(keyPair.privateKey.startsWith("-----BEGIN RSA PRIVATE KEY-----\n")).toBeTruthy();
  expect(keyPair.privateKey.endsWith("-----END RSA PRIVATE KEY-----\n")).toBeTruthy();
  expect(keyPair.publicKey.startsWith("-----BEGIN RSA PUBLIC KEY-----\n")).toBeTruthy();
  expect(keyPair.publicKey.endsWith("-----END RSA PUBLIC KEY-----\n")).toBeTruthy();
});
