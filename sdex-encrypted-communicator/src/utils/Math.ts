import { PreconditionError } from "../Errors";

/**
 * XOR any number of Uint8Arrays.
 * @param args Any number of equal length Uint8Arrays.
 * @returns The XOR-ed result.
 * @throws PreconditionError If the arrays are not of equal length.
 */
export const xorUintArrays = (...args: Array<Uint8Array>): Uint8Array => {
    if (args.length < 2) {
        return <Uint8Array>args[0];
    }
    for (let i = 1; i < args.length; i += 1) {
        if (args[i]?.length !== args[0]?.length) {
            throw new PreconditionError("Arrays must be of equal length to be able to XOR.");
        }
    }
    // Set first Uint8array as result, then one by one xor it (number by number)
    // against the rest of the arrays
    const result = new Uint8Array(<Uint8Array>args[0]);
    // We start with the 2nd element, because the 1st one is already assigned to `result`.
    for (let arrayIndex = 1; arrayIndex < args.length; arrayIndex += 1) {
        for (
            let byteIndex = 0;
            byteIndex < (args[arrayIndex] as Uint8Array).length;
            byteIndex += 1
        ) {
            result[byteIndex] ^= (args[arrayIndex] as Uint8Array)[byteIndex] as number;
        }
    }

    return result;
};
