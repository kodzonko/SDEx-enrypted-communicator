import { blake3 } from "@noble/hashes/blake3";
import { prepareToIngest, prepareToSend } from "../../../src/communication/PayloadComposers";
import { generateInitializationHash, generateSessionKey } from "../../../src/crypto/cryptoHelpers";
import SdexCrypto from "../../../src/crypto/SdexCrypto";
import { Message } from "../../../src/Types";

test.skip("Preparation process for message is fully reversible by ingestion process", async () => {
  const originalMessage = new Message(0, 1, "this is a test.", new Date("2023-01-02"), false);
  const senderPublicKey = `-----BEGIN PUBLIC KEY-----
  MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCzc5oViIvknxXSbuIfqkyaZc1F
  nVvN52Buu136pSC6AbfVGX5KHzR7lzJl1ESxarREY8rrb8QxsNs+FAntuwiZopdW
  8f4zHB91neApkSLtuos4k6Gu78KvbldHkeCx8BdQsWz03lNXpv5REp9wNKGyzenw
  wF1dAlLOSg60efyUkwIDAQAB
  -----END PUBLIC KEY-----`;
  const receiverPublicKey = `-----BEGIN PUBLIC KEY-----
  MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgFn8Dq9VxuIjiBzLmLZY5HUkHcr7
  czMdBKmsY3CiK6zauqmIXZqYLadVJBTh2+v2/kShiQViY+i9HbTJbzl7BTw6p8fr
  B0NWaNdlul/i0EkQZs45dJHe2HZebw7ZbOJmPyhUZAzmzastB7u69qNJANfxIFVB
  uII/u4ssaGki5iTJAgMBAAE=
  -----END PUBLIC KEY-----`;
  const receiverPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
  MIICWwIBAAKBgFn8Dq9VxuIjiBzLmLZY5HUkHcr7czMdBKmsY3CiK6zauqmIXZqY
  LadVJBTh2+v2/kShiQViY+i9HbTJbzl7BTw6p8frB0NWaNdlul/i0EkQZs45dJHe
  2HZebw7ZbOJmPyhUZAzmzastB7u69qNJANfxIFVBuII/u4ssaGki5iTJAgMBAAEC
  gYA6EYKYe04g2LUZf/lIkwy621euiZ3JukwsAmcZZE2y+mPCy5E8FkA/352tLCNz
  nqxvNZ7qrpeytXfaFrOD8HNrqYxpsYjrhc5dmmVsZ6ER7rGMmM1Jqn+cE0l7Ve3S
  V96BXngQkiGNwBmfRns7XjOaPPUWsT2/QNp8sWbne6V/0QJBAKlgV+O8YiesCN6L
  2KF9iw+PrUR3j/6kE0ShqSzsQS9YQm1KQLKHVd5tnsqbXUTeKIIjMDmpNOrwwDP9
  qjvmSwsCQQCIAVKMyPj3kdttw69xFfWGNOJgmhup3SIrUqXEqN6VTULyKEInn3Xp
  Uw2Dy9OmurzkcsWMCkNKnMFbz+zFElP7AkEAmf+6CZsn15BIhCe8sKAYBu8Ih/75
  knoV9snRqsGoRubFht8DUg9Q2KrsvKRkOhCP3jsmRtb9ATwiVWMnG804nwJAJV1f
  pYgNRk7PHw/U4lerFYzv6KROF1PGcGqLWkUeqZwJWWgQDLy1cz27B8t2wWaqQIT7
  muay6Au635N3NAk+AwJAESyykEnrU3yYXhU0hZFUIqUoB01g3qfUa7Ik/eo5NTky
  i/f+WqIAP4RwpCa6eV9bmcI+6WDzU8wDRmYYMA3jew==
  -----END RSA PRIVATE KEY-----`;
  const senderInitializationHash = generateInitializationHash();
  const senderHashFromUserPassword = blake3("1234", {
    dkLen: 32,
  });
  const senderSessionKey = generateSessionKey();
  const senderSdexEngine = new SdexCrypto(
    senderInitializationHash,
    senderHashFromUserPassword,
    senderSessionKey,
  );
  const receiverSdexEngine = senderSdexEngine;

  const messageToSend = await prepareToSend(
    originalMessage,
    senderPublicKey,
    receiverPublicKey,
    senderSdexEngine,
  );
  const ingestedMessage = await prepareToIngest(
    messageToSend,
    receiverSdexEngine,
    receiverPrivateKey,
    1,
  );

  expect(ingestedMessage).toEqual(originalMessage);
});
