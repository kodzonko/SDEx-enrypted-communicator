import { create } from "zustand";
import { CryptoContextState, ThirdPartySdexEngineContext } from "../Types";

export const useCryptoContextStore = create<CryptoContextState>((set) => ({
  firstPartyCryptoContext: undefined,
  thirdPartyCryptoContextsMap: new Map<string, ThirdPartySdexEngineContext>(),
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setFirstPartyCryptoContext: (
    initializationHash: Uint8Array,
    hashFromUserPassword: Uint8Array,
  ): void => {
    set({
      firstPartyCryptoContext: {
        initializationHash,
        hashFromUserPassword,
      },
    });
  },
  addThirdPartyCryptoContext: (
    publicKey: string,
    sessionKey?: Uint8Array,
    initializationHash?: Uint8Array,
    hashFromUserPassword?: Uint8Array,
  ): void => {
    const safePartialUpdate: ThirdPartySdexEngineContext = {};
    if (sessionKey) {
      safePartialUpdate.sessionKey = sessionKey;
    }
    if (initializationHash) {
      safePartialUpdate.initializationHash = initializationHash;
    }
    if (hashFromUserPassword) {
      safePartialUpdate.hashFromUserPassword = hashFromUserPassword;
    }

    set((prev) => ({
      thirdPartyCryptoContextsMap: new Map(prev.thirdPartyCryptoContextsMap).set(publicKey, {
        ...safePartialUpdate,
      }),
    }));
  },
}));
