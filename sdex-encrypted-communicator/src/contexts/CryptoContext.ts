import { create } from "zustand";
import SdexCrypto from "../crypto/SdexCrypto";
import { CryptoContextState } from "../Types";

export const useCryptoContextStore = create<CryptoContextState>((set) => ({
    sdexEngines: new Map<string, SdexCrypto>(),
    addUserEngine: (publicKey: string, sdexEngine: SdexCrypto): void => {
        set((prev) => ({
            sdexEngines: new Map(prev.sdexEngines).set(publicKey, sdexEngine),
        }));
    },
}));
