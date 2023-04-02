import { IChatRoomListItem, IContact } from "./types";

export const sortDescendingByDate = (
  threads: IChatRoomListItem[],
): IChatRoomListItem[] => {
  const arr: IChatRoomListItem[] = [];
  return arr
    .concat(threads)
    .sort((a: IChatRoomListItem, b: IChatRoomListItem) =>
      a.lastMsgDate < b.lastMsgDate ? 1 : -1,
    );
};

export const sortAscendingBySurname = (contacts: IContact[]): IContact[] => {
  const arr: IContact[] = [];
  return arr
    .concat(contacts)
    .sort((a: IContact, b: IContact) => (a.surname > b.surname ? 1 : -1));
};
