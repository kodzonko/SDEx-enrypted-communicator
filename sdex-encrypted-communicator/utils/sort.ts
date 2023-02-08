import { IChatRoomListItem, IContact } from "./types";

export const sortDescendingByDate = (arr: IChatRoomListItem[]): IChatRoomListItem[] => {

  // @ts-expect-error TS(2339): Property 'lastMsgDate' does not exist on type 'nev... Remove this comment to see the full error message
  return [].concat(arr).sort((a, b) => a.lastMsgDate < b.lastMsgDate ? 1 : -1);
};

export const sortAscendingBySurname = (contacts: IContact[]): IContact[] => {

  // @ts-expect-error TS(2339): Property 'surname' does not exist on type 'never'.
  return [].concat(contacts).sort((a, b) => a.surname > b.surname ? 1 : -1);
};