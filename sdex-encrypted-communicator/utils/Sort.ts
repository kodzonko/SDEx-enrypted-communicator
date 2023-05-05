

export const sortDescendingByDate = (
  threads: ChatRoomListItem[],
): ChatRoomListItem[] => {
  const arr: ChatRoomListItem[] = [];
  return arr
    .concat(threads)
    .sort((a: ChatRoomListItem, b: ChatRoomListItem) =>
      a.lastMsgDate < b.lastMsgDate ? 1 : -1,
    );
};

export const sortAscendingBySurname = (contacts: Contact[]): Contact[] => {
  const arr: Contact[] = [];
  return arr
    .concat(contacts)
    .sort((a: Contact, b: Contact) => (a.surname > b.surname ? 1 : -1));
};
