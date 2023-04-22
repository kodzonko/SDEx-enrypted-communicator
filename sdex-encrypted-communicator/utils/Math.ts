import { PreconditionError } from "../Errors";

// export const XORByteArrays = (arr1: Uint8Array, arr2: Uint8Array): Uint8Array => {
//   if (arr1.length !== arr2.length) {
//     throw new PreconditionError(
//       "Tablice muszą być jednakowej długości aby wykonać XOR.",
//     );
//   }
//   const result = new Uint8Array(arr1.length);
//   for (let i = 0; i < arr1.length; i++) {
//     result[i] = arr1[i] ^ arr2[i];
//   }
//
//   return result;
// };

export const XORByteArrays = (...args: Array<Uint8Array>): Uint8Array => {
  args.forEach((value) => {
    if (value.length !== args[0].length) {
      throw new PreconditionError("Arrays must be of equal length to be able to XOR.");
    }
  });

  let result = new Uint8Array(args[0]);
  for (let i = 1; i < args.length; i++) {
    for (let j = 0; j < args[i].length; j++) {
      result[j] ^= args[i][j];
    }
  }

  return result;
};
