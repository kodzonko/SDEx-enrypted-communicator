import { prepareToIngest, prepareToSend } from "../../src/communication/PayloadComposers";
import { generateSessionKeyPart } from "../../src/crypto/CryptoHelpers";
import SdexCrypto from "../../src/crypto/SdexCrypto";
import { Message, TransportedMessage } from "../../src/Types";
import { mergeUint8Arrays } from "../../src/utils/Converters";

test("Encrypt and decrypt a message between two clients.", async () => {
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
    const inputMessage = new Message(0, 1, "test ąęćśóżź.", new Date(2000, 1, 1), true);
    const sessionKeyFirstPart = generateSessionKeyPart();
    const sessionKeySecondPart = generateSessionKeyPart();
    const sessionKey = mergeUint8Arrays(sessionKeyFirstPart, sessionKeySecondPart);
    const sdexEngine = new SdexCrypto(sessionKey);
    const transportReadyMessage: TransportedMessage = prepareToSend(
        inputMessage,
        senderPublicKey,
        receiverPublicKey,
        sdexEngine,
    );
    const decryptedMessage = prepareToIngest(transportReadyMessage, sdexEngine, 5);
    expect(decryptedMessage.contactIdFrom).toEqual(5);
    expect(decryptedMessage.contactIdTo).toEqual(0);
    expect(inputMessage.text).toEqual(decryptedMessage.text);
    expect(inputMessage.image).toEqual(decryptedMessage.image);
    expect(inputMessage.video).toEqual(decryptedMessage.video);
    expect(inputMessage.audio).toEqual(decryptedMessage.audio);
    expect(inputMessage.createdAt).toEqual(decryptedMessage.createdAt);
});
