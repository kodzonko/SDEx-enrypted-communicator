import { create } from "zustand";
import { CryptoContextState, PersonalSdexEngineContext } from "../Types";

export const useCryptoContextStore = create<CryptoContextState>((set) => ({
  myCryptoContext: undefined,
  othersCryptoContexts: new Map<string, PersonalSdexEngineContext & { sessionKey: Uint8Array }>(),
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setMyCryptoContext: (initializationHash: Uint8Array, hashFromUserPassword: Uint8Array): void => {
    set({
      myCryptoContext: {
        initializationHash,
        hashFromUserPassword,
      },
    });
  },
  addOthersCryptoContext: (
    publicKey: string,
    sessionKey: Uint8Array,
    initializationHash?: Uint8Array,
    hashFromUserPassword?: Uint8Array,
  ): void =>
    set((prev) => ({
      othersCryptoContexts: new Map(prev.othersCryptoContexts).set(publicKey, {
        sessionKey,
        initializationHash,
        hashFromUserPassword,
      }),
    })),
}));
