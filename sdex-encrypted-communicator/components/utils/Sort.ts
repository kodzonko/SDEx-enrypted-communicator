import { ChatRoomListItem, Contact, Message } from "../Types";

export const sortChatRoomsDescendingByDate = (
  chatRoomListItems: ChatRoomListItem[],
): ChatRoomListItem[] => {
  return chatRoomListItems.sort(
    (a, b) => b.lastMsgDate.getTime() - a.lastMsgDate.getTime(),
  );
};

export const sortMessagesAscendingByDate = (messages: Message[]): Message[] => {
  return messages.sort((a, b) => a.time.getTime() - b.time.getTime());
};

export const sortAscendingBySurname = (contactsList: Contact[]): Contact[] => {
  return contactsList.sort((a: Contact, b: Contact) =>
    a.surname > b.surname ? 1 : -1,
  );
};
