import { IMessage as GiftedChatMessage } from "react-native-gifted-chat/lib/Models";
import { Contact, Message } from "../Types";

export const stringToBytes = (str: string): Uint8Array => {
  const utf8Encode = new TextEncoder();
  return utf8Encode.encode(str);
};

export const bytesToString = (bytes: Uint8Array): string => {
  const utf8Decode = new TextDecoder();
  return utf8Decode.decode(bytes);
};

/**
 * Converts object of Message type to object of IMessage (GiftedChatMessage) type.
 * @param message A message object of Message type.
 * @param contact A contact object of Contact type; Author of the message.
 * @returns An object fulfilling IMessage (GiftedChatMessage) interface.
 */
export const messageToGiftedChatMessage = (
  message: Message,
  contact: Contact,
): GiftedChatMessage => ({
  _id: message.id ? message.id : -1,
  text: message.text,
  createdAt: message.createdAt,
  image: message.image,
  video: message.video,
  audio: message.audio,
  user: {
    _id: message.contactId,
    name: `${contact.name} ${contact.surname}`,
  },
});

/**
 * Merges any number of Uint8Arrays into one.
 * @param args Any number of Uint8Arrays.
 * @returns The merged Uint8Array.
 */
export const mergeUint8Arrays = (...args: Array<Uint8Array>): Uint8Array => {
  let totalLength = 0;
  args.forEach((array) => {
    totalLength += array.length;
  });
  const result = new Uint8Array(totalLength);
  let offset = 0;
  args.forEach((array) => {
    result.set(array, offset);
    offset += array.length;
  });
  return result;
};

/**
 * Split a byte array into blocks suitable for encryption or decryption process.
 * Length of a single block has to be the same as the length of hashes.
 * @returns A message byte array split into subarrays with the same length as hashing function's outcome.
 */
export const splitMessageIntoBlocks = (
  messageByteArray: Uint8Array,
  length: number,
): Uint8Array[] => {
  const result = <Uint8Array[]>[];
  for (let i = 0; i < Math.ceil(messageByteArray.length / length); i += length) {
    // this is done to create blocks of equal length. If last block is smaller it will be padded with zeros.
    const block = new Uint8Array(length);
    const slice = messageByteArray.slice(i, i + length);
    block.set(slice);
    result.push(block);
  }
  return result;
};

export const changeTo1IndexedArray = (array: Uint8Array[]): Uint8Array[] => {
  const oneIndexedArray = <Uint8Array[]>[];
  for (let i = 0; i < array.length; i += 1) {
    oneIndexedArray[i + 1] = <Uint8Array>array[i];
  }
  return oneIndexedArray;
};
