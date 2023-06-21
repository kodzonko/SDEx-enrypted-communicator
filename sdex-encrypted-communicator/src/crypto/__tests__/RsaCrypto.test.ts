import { generateKeyPair } from "../RsaCrypto";

test("Generating RSA key pair.", () => {
  const keyPair = generateKeyPair();
  expect(keyPair.privateKey.startsWith("-----BEGIN RSA PRIVATE KEY-----\n")).toBeTruthy();
  expect(keyPair.publicKey.startsWith("-----BEGIN RSA PUBLIC KEY-----\n")).toBeTruthy();
});
