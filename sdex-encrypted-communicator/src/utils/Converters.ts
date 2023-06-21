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

export const messageToGiftedChatMessage = (
  message: Message,
  contact: Contact,
): GiftedChatMessage => ({
  _id: message.id,
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
