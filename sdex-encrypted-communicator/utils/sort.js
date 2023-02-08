export const sortDescendingByDate = (arr) => {

  return [].concat(arr).sort((a, b) => a.lastMsgDate < b.lastMsgDate ? 1 : -1);
};

export const sortAscendingBySurname = (arr) => {

  return [].concat(arr).sort((a, b) => a.surname > b.surname ? 1 : -1);
};