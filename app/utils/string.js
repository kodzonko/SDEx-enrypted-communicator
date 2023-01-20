const formattedVideoKey = string =>
  string
    .trim()
    .toLowerCase()
    .replace(' ', '+');

export default { formattedVideoKey };
