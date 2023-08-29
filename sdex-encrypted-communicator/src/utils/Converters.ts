import { decode as atob, encode as btoa } from "base-64";
import { IMessage as GiftedChatMessage } from "react-native-gifted-chat/lib/Models";
import { Contact, Message, TransportedMessage } from "../Types";

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
    _id: message.contactIdFrom,
    name: `${contact.name} ${contact.surname}`,
  },
});

/**
 * Converts object of IMessage (GiftedChatMessage) type to object of type Message.
 * @param message A message object of IMessage type.
 * @param contactIdTo Id of contact to receive the message.
 * @returns An object fulfilling IMessage (GiftedChatMessage) interface.
 */
export const giftedChatMessageToMessage = (
  message: GiftedChatMessage,
  contactIdTo: number,
): Message =>
  new Message(
    // eslint-disable-next-line no-underscore-dangle
    Number(message.user._id),
    contactIdTo,
    message.text,
    message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt),
    false,
    message.image,
    message.video,
    message.audio,
  );

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

/**
 * Converts an array of Uint8Arrays to 1-indexed array.
 * The element at index 0 is left empty.
 * @param array
 * @returns A copied input array with the first (0-th) element left empty. Array's length is increased by 1.
 */
export const changeTo1IndexedArray = (array: Uint8Array[]): Uint8Array[] => {
  const oneIndexedArray = <Uint8Array[]>[];
  for (let i = 0; i < array.length; i += 1) {
    oneIndexedArray[i + 1] = <Uint8Array>array[i];
  }
  return oneIndexedArray;
};

/**
 * Converts Uint8Array to base64 string.
 * @param array
 * @returns A base64 string.
 */
export const uint8ArrayToBase64String = (array: Uint8Array): string => {
  let result = "";
  for (let i = 0; i < array.length; i += 1) {
    result += String.fromCharCode(array[i] as number);
  }
  return btoa(result);
};

/**
 * Converts base64 string to Uint8Array.
 * @param base64String
 * @returns An Uint8Array.
 */
export const base64StringToUint8Array = (base64String: string): Uint8Array => {
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export function messageToTransportedMessage(
  message: Message,
  publicKeyFrom: string,
  publicKeyTo: string,
): TransportedMessage {
  const result = {
    publicKeyTo,
    publicKeyFrom,
    text: message.text,
    createdAt: message.createdAt,
    image: message.image,
    video: message.video,
    audio: message.audio,
  };
  return result;
}
