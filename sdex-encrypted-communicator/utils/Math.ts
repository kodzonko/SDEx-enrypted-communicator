import { PreconditionError } from "../Errors";

/**
 * XOR any number of Uint8Arrays.
 * @param args Any number of equal length Uint8Arrays.
 * @returns The XORed result.
 * @throws PreconditionError If the arrays are not of equal length.
 */
export const XORByteArrays = (...args: Array<Uint8Array>): Uint8Array => {
  if (args.length < 2) {
    return args[0] as Uint8Array;
  } else {
    for (let i = 1; i < args.length; i += 1) {
      if (args[i]?.length !== args[0]?.length) {
        throw new PreconditionError(
          "Arrays must be of equal length to be able to XOR.",
        );
      }
    }
    // Set first Uint8array as result, a one by one xor it (number by number)
    // against the rest of the arrays
    const result = new Uint8Array(args[0] as Uint8Array);
    // We start with the 2nd element, because the 1st one is already assigned to `result`.
    for (let i = 1; i < args.length; i += 1) {
      for (let j = 0; j < (args[i] as Uint8Array).length; j += 1) {
        result[j] ^= (args[i] as Uint8Array)[j] as number;
      }
    }

    return result;
  }
};
