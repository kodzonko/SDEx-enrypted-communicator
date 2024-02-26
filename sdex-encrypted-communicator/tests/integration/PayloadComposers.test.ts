import { prepareToIngest, prepareToSend } from "../../src/communication/PayloadComposers";
import { generateSessionKeyPart } from "../../src/crypto/CryptoHelpers";
import SdexCrypto from "../../src/crypto/SdexCrypto";
import { Message } from "../../src/Types";

test("Preparation process for message is fully reversible by ingestion process", async () => {
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
    // for this test we skip combining session key parts and just provide a ready full length session key
    const senderSessionKey = generateSessionKeyPart(64);
    const sdexEngine = new SdexCrypto(senderSessionKey);

    const messageToSend = prepareToSend(
        originalMessage,
        senderPublicKey,
        receiverPublicKey,
        sdexEngine,
    );
    const ingestedMessage = prepareToIngest(messageToSend, sdexEngine, 1);
    expect(ingestedMessage.contactIdFrom).toEqual(1);
    expect(ingestedMessage.contactIdTo).toEqual(0);
    expect(ingestedMessage.text).toEqual(originalMessage.text);
    expect(ingestedMessage.createdAt).toEqual(originalMessage.createdAt);
    expect(ingestedMessage.image).toEqual(originalMessage.image);
    expect(ingestedMessage.video).toEqual(originalMessage.video);
    expect(ingestedMessage.audio).toEqual(originalMessage.audio);
});
