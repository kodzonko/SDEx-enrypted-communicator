import { blake3 } from "@noble/hashes/blake3";

test("encrypting a block of text produces XORed result", () => {});
const utf8Encode = new TextEncoder();
const msgBytes = utf8Encode.encode("test message!");
const msg_Back = new TextDecoder().decode(msgBytes);
expect(
  blake3("anjkdcnjkvndfjknjkfdnjkfnjmkjlmnjkljlnkdnjvkfdnjkvfndkjn jkdfj").length,
).toEqual(32);
// expect(msgBytes.length).toEqual(1);
expect(msg_Back).toEqual("ą");
let d = ["dd", "bb"];
expect(d.slice(0, 10)).toEqual(["dd", "bb"]);
export {};
