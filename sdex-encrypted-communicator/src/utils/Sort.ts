import { ChatRoom, ContactListItem, Message } from "../Types";

export const sortChatRoomsDescendingByDate = (chatRoomListItems: ChatRoom[]): ChatRoom[] =>
    chatRoomListItems.sort((a, b) => b.lastMessageDate.getTime() - a.lastMessageDate.getTime());

export const sortMessagesAscendingByDate = (messages: Message[]): Message[] =>
    messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

export const sortContactsAscendingBySurname = (
    contactsList: ContactListItem[],
): ContactListItem[] =>
    contactsList.sort((a: ContactListItem, b: ContactListItem) => (a.surname > b.surname ? 1 : -1));
