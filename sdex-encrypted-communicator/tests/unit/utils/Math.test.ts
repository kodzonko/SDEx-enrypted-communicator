import { xorUintArrays } from "../../../src/utils/Math";

test("XOR-ing multiple Uint8Arrays.", () => {
    const array1 = new Uint8Array([121, 133]); //   01111001 10000101
    const array2 = new Uint8Array([38, 6]); //      00100110 00000110
    const array3 = new Uint8Array([130, 69]); //    10000010 01000101
    const xoredResult = xorUintArrays(array1, array2, array3);
    const expected = new Uint8Array([221, 198]); // 11011101 11000110
    expect(xoredResult).toEqual(expected);
});
