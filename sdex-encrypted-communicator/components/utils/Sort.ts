

export const sortDescendingByDate = (
  chatRoomListItems: ChatRoomListItem[],
): ChatRoomListItem[] => {
  const arr: ChatRoomListItem[] = [];
  return arr
    .concat(chatRoomListItems)
    .sort((a: ChatRoomListItem, b: ChatRoomListItem) =>
      a.lastMsgDate < b.lastMsgDate ? 1 : -1,
    );
};

export const sortAscendingBySurname = (contactsList: Contact[]): Contact[] => {
  const arr: Contact[] = [];
  return arr
    .concat(contactsList)
    .sort((a: Contact, b: Contact) => (a.surname > b.surname ? 1 : -1));
};
