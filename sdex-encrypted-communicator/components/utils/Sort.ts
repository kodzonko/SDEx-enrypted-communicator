import { ChatRoom, Contact, Message } from "../Types";

export const sortChatRoomsDescendingByDate = (chatRoomListItems: ChatRoom[]): ChatRoom[] =>
  chatRoomListItems.sort((a, b) => b.lastMessageDate.getTime() - a.lastMessageDate.getTime());

export const sortMessagesAscendingByDate = (messages: Message[]): Message[] =>
  messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

export const sortAscendingBySurname = (contactsList: Contact[]): Contact[] =>
  contactsList.sort((a: Contact, b: Contact) => (a.surname > b.surname ? 1 : -1));
