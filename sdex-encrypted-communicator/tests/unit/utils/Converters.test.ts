import { IMessage as GiftedChatMessage } from "react-native-gifted-chat/lib/Models";
import { Contact, Message } from "../../../src/Types";
import {
    bytesToString,
    mergeUint8Arrays,
    messageToGiftedChatMessage,
    stringToBytes,
} from "../../../src/utils/Converters";

test("Convert a string to a byte array (Uint8Array).", () => {
    const encodedString = stringToBytes("test");
    const expected = new Uint8Array([116, 101, 115, 116]);
    expect(encodedString).toEqual(expected);
});

test("Convert a byte array (Uint8Array) to a string.", () => {
    const decodedString = bytesToString(new Uint8Array([116, 101, 115, 116]));
    expect(decodedString).toBe("test");
});

test("String to bytes conversion is reversible.", () => {
    const testString = "this is a test+=/\\|ąęśćżźó.,<";
    const bytes = stringToBytes(testString);
    const decodedString = bytesToString(bytes);
    expect(decodedString).toBe(testString);
});

test("Merge several byte arrays (Uint8Array) into one.", () => {
    const array1 = new Uint8Array([7, 133]);
    const array2 = new Uint8Array([26, 250]);
    const array3 = new Uint8Array([1, 0]);
    const expected = new Uint8Array([7, 133, 26, 250, 1, 0]);
    const mergedArrays = mergeUint8Arrays(array1, array2, array3);
    expect(mergedArrays).toEqual(expected);
});

test("Convert Message into GiftChatMessage", () => {
    const contact = new Contact("Jane", "Doe", "rsa-key-123", 17);
    const firstPartyContact = new Contact("Your", "Profile", "rsa-key-111", 0);
    const message = new Message(
        17,
        2,
        "Hello world!",
        new Date("2001-11-21T15:38:54.123Z"),
        true,
        "base64-123",
    );
    const expected: GiftedChatMessage = {
        _id: -1,
        text: "Hello world!",
        createdAt: new Date("2001-11-21T15:38:54.123Z"),
        image: "base64-123",
        video: undefined,
        audio: undefined,
        user: { _id: 17, name: "Jane Doe" },
    };
    const giftedChatMessage = messageToGiftedChatMessage(message, contact, firstPartyContact);
    expect(giftedChatMessage).toEqual(expected);
});
