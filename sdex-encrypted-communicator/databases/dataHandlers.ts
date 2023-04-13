import { IChatRoomListItem, IContact } from "../types";
import {
  getValue as getInsecure,
  saveValue as saveInsecure,
} from "./asyncStorageMiddlewares";

export const loadContacts = (): IContact[] => {
  const contacts = <IContact[] | null>(<unknown>getInsecure("contacts"));
  return contacts !== null ? contacts : [];
};

export const saveContacts = (contacts: IContact[]): void => {
  saveInsecure("contacts", contacts);
};

export const loadChatRooms = (): IChatRoomListItem[] => {
  const chatRooms = <IChatRoomListItem[] | null>(<unknown>getInsecure("chatRooms"));
  return chatRooms !== null ? chatRooms : [];
};

export const saveChatRooms = (chatRooms: IChatRoomListItem[]): void => {
  saveInsecure("chatRooms", chatRooms);
};
