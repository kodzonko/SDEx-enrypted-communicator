export const stringToBytes = (str: string): Uint8Array => {
  const utf8Encode = new TextEncoder();
  return utf8Encode.encode(str);
};

export const bytesToString = (bytes: Uint8Array): string => {
  const utf8Decode = new TextDecoder();
  return utf8Decode.decode(bytes);
};
